import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { generateScript, type Stance } from '@/lib/anthropic'

const STANCES: ReadonlySet<Stance> = new Set(['support', 'oppose', 'undecided'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { billId, stance } = (body ?? {}) as { billId?: unknown; stance?: unknown }

  if (typeof billId !== 'string' || !UUID_RE.test(billId)) {
    return NextResponse.json({ error: 'billId must be a uuid' }, { status: 400 })
  }
  if (typeof stance !== 'string' || !STANCES.has(stance as Stance)) {
    return NextResponse.json(
      { error: "stance must be 'support', 'oppose', or 'undecided'" },
      { status: 400 },
    )
  }

  const adminClient = createAdminClient()

  // ---- Cache lookup -------------------------------------------------
  // This is the hard cost rule from CLAUDE.md: every script generation
  // is cached per (user_id, bill_id, stance) and never regenerated.
  // The unique constraint on script_generations enforces this at the
  // DB layer; this read guarantees we never call Anthropic on a hit.
  const { data: cached, error: cacheErr } = await adminClient
    .from('script_generations')
    .select('id, script_text')
    .eq('user_id', userId)
    .eq('bill_id', billId)
    .eq('stance', stance)
    .maybeSingle()

  if (cacheErr) {
    return NextResponse.json({ error: 'Cache lookup failed' }, { status: 500 })
  }
  if (cached) {
    // `id` widens the response by exactly one field — the row's uuid —
    // so Feature 5 can thread it into call_events.script_generation_id.
    // Safe to expose: we filtered by user_id, so this is always the
    // caller's own row.
    return NextResponse.json({ id: cached.id, script_text: cached.script_text, cached: true })
  }

  // ---- Miss path: fetch context, generate, persist ------------------
  const { data: bill, error: billErr } = await adminClient
    .from('bills')
    .select('title, summary_text, ai_summary')
    .eq('id', billId)
    .maybeSingle()
  if (billErr) {
    return NextResponse.json({ error: 'Bill lookup failed' }, { status: 500 })
  }
  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('user_id', userId)
    .maybeSingle()

  const { data: interests } = await adminClient
    .from('user_interests')
    .select('category, subcategory')
    .eq('user_id', userId)
    .order('rank')
    .limit(5)

  const userName =
    profile?.full_name || session.user.email?.split('@')[0] || 'A constituent'
  const userInterests = (interests ?? []).map((i) => i.subcategory || i.category)

  let generated
  try {
    generated = await generateScript({
      billTitle: bill.title,
      billSummary: bill.ai_summary || bill.summary_text || '',
      userName,
      userInterests,
      stance: stance as Stance,
    })
  } catch (err) {
    console.error('[scripts] generation failed', err)
    return NextResponse.json({ error: 'Script generation failed' }, { status: 500 })
  }

  // Empty-content guard: if the model returned blank text (non-text
  // content block, refusal, or whitespace-only output), treat it as a
  // generation failure. Persisting an empty row would poison the
  // (user_id, bill_id, stance) cache — every subsequent request would
  // hit the cache and serve an empty script forever.
  if (!generated.scriptText.trim()) {
    console.error('[scripts] generation returned empty script_text — not caching')
    return NextResponse.json({ error: 'Script generation returned empty content' }, { status: 500 })
  }

  const { data: inserted, error: insertErr } = await adminClient
    .from('script_generations')
    .insert({
      user_id: userId,
      bill_id: billId,
      stance,
      script_text: generated.scriptText,
      prompt_hash: generated.promptHash,
      model: generated.model,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
      cost_usd: generated.costUsd,
    })
    .select('id')
    .single()

  if (insertErr) {
    // The script was generated (Anthropic was paid) but we couldn't
    // cache it. Return the text anyway so the user gets value from
    // this call; the next request will regenerate. Real protection
    // against runaway cost is the Anthropic dashboard daily cap.
    // Expected case: two near-simultaneous misses both generate, one
    // insert wins, the other lands here on the unique-key violation.
    // `id` is null on this branch — call_events.script_generation_id
    // is nullable, so Feature 5 simply logs without the audit link.
    console.error('[scripts] cache insert failed — returning uncached script', insertErr)
    return NextResponse.json({ id: null, script_text: generated.scriptText, cached: false })
  }

  return NextResponse.json({ id: inserted.id, script_text: generated.scriptText, cached: false })
}
