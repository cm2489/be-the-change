import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Self-report endpoint for Feature 5. The user taps a tel: link (mobile)
// or copies the number (desktop), then confirms "yes, I called" — this
// route logs a row to call_events. There is no server-side dialing,
// recording, or Twilio integration (FEATURES.md scope).
//
// Bill and representative FK constraints enforce existence. We don't
// require the rep to be in the caller's user_representatives — a user
// might call any federal rep, and call_events is just an audit log.
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

  const { billId, representativeId, scriptGenerationId } = (body ?? {}) as {
    billId?: unknown
    representativeId?: unknown
    scriptGenerationId?: unknown
  }

  if (typeof billId !== 'string' || !UUID_RE.test(billId)) {
    return NextResponse.json({ error: 'billId must be a uuid' }, { status: 400 })
  }
  if (typeof representativeId !== 'string' || !UUID_RE.test(representativeId)) {
    return NextResponse.json({ error: 'representativeId must be a uuid' }, { status: 400 })
  }

  let scriptGenerationIdToLink: string | null = null
  if (scriptGenerationId !== undefined && scriptGenerationId !== null) {
    if (typeof scriptGenerationId !== 'string' || !UUID_RE.test(scriptGenerationId)) {
      return NextResponse.json(
        { error: 'scriptGenerationId must be a uuid when provided' },
        { status: 400 },
      )
    }
    scriptGenerationIdToLink = scriptGenerationId
  }

  const adminClient = createAdminClient()

  // Ownership check: script_generations.id is FK-validated by Postgres,
  // but the FK doesn't constrain ownership — without this, a client
  // could link a call_event to another user's script row.
  if (scriptGenerationIdToLink) {
    const { data: ownsScript, error: ownErr } = await adminClient
      .from('script_generations')
      .select('id')
      .eq('id', scriptGenerationIdToLink)
      .eq('user_id', userId)
      .maybeSingle()
    if (ownErr) {
      return NextResponse.json({ error: 'Script lookup failed' }, { status: 500 })
    }
    if (!ownsScript) {
      return NextResponse.json(
        { error: 'scriptGenerationId does not belong to the current user' },
        { status: 400 },
      )
    }
  }

  const { data: inserted, error: insertErr } = await adminClient
    .from('call_events')
    .insert({
      user_id: userId,
      bill_id: billId,
      representative_id: representativeId,
      script_generation_id: scriptGenerationIdToLink,
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('[calls] insert failed', insertErr)
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id })
}
