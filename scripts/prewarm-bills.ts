/**
 * scripts/prewarm-bills.ts — DESIGN / DEMO ACCELERANT, not the product mechanism.
 *
 * Generates a plain-language "Decoded" summary from each bill's FULL TEXT
 * (Congress.gov) and writes it straight to bills.ai_summary via the service
 * role. Purpose: fill the Decoded hero with real, varied content so the
 * ceiling design pass is judged against real data (the floor's "verify
 * against real data, never a fixture" rule).
 *
 * This is NOT the spec'd ai_summary pipeline. The lazy-on-view / sync-time
 * generation (FEATURES.md §4) remains deferred and unbuilt — see
 * docs/deferred.md#feature-3-prewarm-demo-bills. When that path is built it
 * MUST be cache-first (skip when ai_summary is already set) so these
 * pre-filled rows read as cache hits rather than being regenerated.
 *
 * - Bounded: only the explicit SAMPLE list — no open-ended loop.
 * - Idempotent: skips any bill that already has ai_summary.
 * - Writes bills.ai_summary only — never script_generations (that cache is
 *   keyed (user_id, bill_id, stance); a summary has neither).
 *
 * Run:  tsx --env-file=.env.local scripts/prewarm-bills.ts
 * Env:  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
 *       CONGRESS_API_KEY
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Curated sample (probed 2026-05-31: 19/19 have Formatted Text). Leans tagged
// (exercises the populated relevance badge), keeps untagged ones (no-match
// state), spans title length 16→428ch and status committee/markup/
// passed_chamber/floor_vote/signed.
const SAMPLE = [
  'hr-8585-119', 's-4439-119', 's-4400-119', 'sjres-141-119', 'hr-6099-119',
  'hr-1-119', 's-1626-119', 'hr-1346-119', 'hr-7463-119', 'hr-4642-119',
  'hr-2701-119', 'hr-7903-119', 's-4189-119', 's-1776-118',
  'hr-8568-119', 'sjres-156-119', 'hr-8577-119', 's-3923-119', 'hr-6130-119',
]

const MODEL = 'claude-sonnet-4-6'
const PRICE = { in: 3, out: 15 }   // USD per 1M tokens (Sonnet) — for the cost log only
const CAP_CHARS = 60_000           // ~15k tokens of bill text fed to the model
const CONGRESS_BASE = 'https://api.congress.gov/v3'

function env(name: string): string {
  const v = process.env[name]
  if (!v) { console.error(`Missing env: ${name}`); process.exit(1) }
  return v
}

const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
const anthropic = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') })
const CONGRESS_KEY = env('CONGRESS_API_KEY')

interface TextVersion { date: string | null; type: string; formats: { type: string; url: string }[] }

function parseId(id: string) {
  const parts = id.split('-')
  const congress = parts.pop()!
  const number = parts.pop()!
  return { type: parts.join('-'), number, congress }
}

// Minimal HTML → text: drop script/style, strip tags, decode the few entities
// congress.gov bill HTML uses, collapse whitespace.
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

// Newest Formatted-Text version → plain text, truncated to CAP_CHARS.
// Returns null when no usable text version exists (caller skips + reports).
async function fetchBillText(id: string): Promise<{ text: string; truncated: boolean } | null> {
  const { type, number, congress } = parseId(id)
  const url = `${CONGRESS_BASE}/bill/${congress}/${type}/${number}/text?format=json&limit=250&api_key=${CONGRESS_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const data = (await res.json()) as { textVersions?: TextVersion[] }
  const withFmt = (data.textVersions ?? [])
    .map((v) => ({ v, fmt: v.formats.find((f) => f.type === 'Formatted Text') }))
    .filter((x): x is { v: TextVersion; fmt: { type: string; url: string } } => Boolean(x.fmt))
  if (!withFmt.length) return null
  withFmt.sort((a, b) => String(b.v.date ?? '').localeCompare(String(a.v.date ?? '')))
  const html = await (await fetch(withFmt[0].fmt.url)).text()
  const full = htmlToText(html)
  return { text: full.slice(0, CAP_CHARS), truncated: full.length > CAP_CHARS }
}

const SYSTEM = `You translate U.S. federal legislation into plain language for ordinary citizens. You are factual, neutral, and strictly non-partisan. Explain what a bill actually does — its core provisions and who it affects — in clear everyday English. Base your explanation ONLY on the bill text provided; never invent provisions, dollar figures, dates, or effects that are not in the text. Do not editorialize, advocate, or use procedural jargon.`

async function summarize(title: string, text: string, truncated: boolean) {
  const note = truncated ? "\n\n(Note: the text below is truncated to the bill's opening sections.)" : ''
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Bill: ${title}${note}\n\nOfficial text:\n${text}\n\nWrite ONE plain-language paragraph (3–5 sentences) explaining what this bill does and who it affects, for someone with no legal or policy background. Lead with the core action, not the bill's name. Do not mention section numbers or procedural status. If this is only a short procedural resolution, say plainly what it approves or disapproves.`,
    }],
  })
  // Find-by-type (not [0]): Sonnet may emit a non-text block first; indexing
  // [0] would silently drop the summary as "empty". Narrowed for strict TS.
  const block = msg.content.find((b) => b.type === 'text')
  const out = block?.type === 'text' ? block.text.trim() : ''
  return { out, inT: msg.usage?.input_tokens ?? 0, outT: msg.usage?.output_tokens ?? 0 }
}

async function main() {
  let written = 0, skipped = 0, failed = 0, costUsd = 0
  for (const ident of SAMPLE) {
    const { data: bill, error } = await supabase
      .from('bills').select('id, title, ai_summary').eq('full_identifier', ident).maybeSingle()
    if (error || !bill) { console.log(`✗ ${ident}: not found in DB`); failed++; continue }
    if (bill.ai_summary) { console.log(`• ${ident}: already summarized — skip`); skipped++; continue }

    const fetched = await fetchBillText(ident)
    if (!fetched) { console.log(`✗ ${ident}: no usable bill text — skip`); failed++; continue }

    const { out, inT, outT } = await summarize(bill.title, fetched.text, fetched.truncated)
    if (!out) { console.log(`✗ ${ident}: empty model output — not writing`); failed++; continue }

    const { error: upErr } = await supabase.from('bills').update({ ai_summary: out }).eq('id', bill.id)
    if (upErr) { console.log(`✗ ${ident}: write failed — ${upErr.message}`); failed++; continue }

    const c = (inT / 1e6) * PRICE.in + (outT / 1e6) * PRICE.out
    costUsd += c; written++
    console.log(`✓ ${ident}: wrote ${out.length} chars${fetched.truncated ? ' (input truncated)' : ''} — ${inT}+${outT} tok, $${c.toFixed(4)}`)
  }
  console.log(`\nDone. written=${written} skipped=${skipped} failed=${failed} cost=$${costUsd.toFixed(4)}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
