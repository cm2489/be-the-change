/**
 * scripts/backfill-summaries.ts — one-off AI-summary backfill.
 *
 * REVIEW DRAFT — NOTHING HAS BEEN RUN. This is the spec'd-but-unbuilt
 * product backfill (FEATURES.md §4): generate a plain-language "Decoded"
 * summary for every bill whose `bills.ai_summary` is still NULL, from the
 * bill's FULL TEXT (Congress.gov), and write it via the service role.
 *
 * Generalized from scripts/prewarm-bills.ts (the local script that wrote
 * the first 19 rows). The MODEL, SYSTEM/user prompt, and Congress.gov
 * text-fetch path are carried over UNCHANGED — only selection, flags,
 * cost ceiling, concurrency, retry, and checkpoint logging are new.
 *
 * Selection: all bills WHERE ai_summary IS NULL, ordered most-advanced
 * legislative stage first (STAGE_RANK desc, urgency_score desc) so a
 * partial / aborted run captures the highest-value bills first.
 * Idempotent: a re-run re-selects only still-null rows, so it resumes
 * cleanly after an abort. No-text bills are skipped + logged, never faked.
 *
 * Dry run (5-bill sample, ZERO Anthropic calls, ZERO writes):
 *   npx tsx --env-file=.env.local scripts/backfill-summaries.ts --dry-run --limit 5
 * Full backfill (writes — only after Colby approves a spend ceiling):
 *   npx tsx --env-file=.env.local scripts/backfill-summaries.ts --max-spend 25
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      ANTHROPIC_API_KEY, CONGRESS_API_KEY
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ---- config ----------------------------------------------------------
const DEFAULT_MODEL = 'claude-sonnet-4-6' // carried from prewarm-bills.ts
const DEFAULT_MAX_SPEND = 30 // USD; hard ceiling, overridable via --max-spend
const DEFAULT_CONCURRENCY = 3 // each bill = 2 Congress fetches + 1 Anthropic call
const DRY_RUN_OUTPUT_TOKENS = 250 // assumed output for the dry-run estimate only
const CAP_CHARS = 60_000 // ~15k tokens of bill text fed to the model
const CONGRESS_BASE = 'https://api.congress.gov/v3'
const MAX_RETRIES = 4 // per Congress.gov fetch, on 429 / 5xx / network error
const SELECT_CAP = 5000 // safety cap on the null-set fetch (currently ~463 rows)

// List prices, USD per 1M tokens. Drives the cost log AND the --max-spend
// ceiling, so an unknown model aborts rather than mis-estimating. VERIFY
// against current Anthropic pricing before a real run.
const PRICES: Record<string, { in: number; out: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-haiku-4-5': { in: 1, out: 5 },
}

// Legislative-advancement rank — "most advanced first". NOT alphabetical
// (the status column ordered alphabetically would be wrong), so we sort in
// JS on this explicit map, urgency_score as the within-stage tiebreak.
// To order by the project's canonical measure instead, sort on
// urgency_score alone — that's the one-line alternative.
const STAGE_RANK: Record<string, number> = {
  signed: 6,
  floor_vote: 5,
  passed_chamber: 4,
  conference: 4,
  markup: 3,
  committee: 2,
  introduced: 1,
  vetoed: 0,
}

type Outcome =
  | 'summarized'
  | 'skipped-already-set'
  | 'skipped-no-text'
  | 'skipped-ceiling'
  | 'error'

interface BillRow {
  id: string
  full_identifier: string
  title: string
  status: string
  urgency_score: number | null
}

// ---- env + clients ---------------------------------------------------
function env(name: string): string {
  const v = process.env[name]
  if (!v) { console.error(`Missing env: ${name}`); process.exit(1) }
  return v
}

const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
// maxRetries: the SDK already retries 429/5xx with exponential backoff and
// honors Retry-After; the default of 2 wasn't enough under sustained
// 30k-input-tok/min pressure (the full run 429'd 31 bills at concurrency 3).
// Raising it lets transient rate-limit 429s self-throttle and recover.
// Retries are transparent — create() returns only the final successful message
// (with its usage), so the cost accounting below counts each call exactly once;
// an exhausted retry throws and is caught as an error with no cost added.
const anthropic = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY'), maxRetries: 8 })
const CONGRESS_KEY = env('CONGRESS_API_KEY')

// ---- args ------------------------------------------------------------
interface Args {
  dryRun: boolean
  limit: number | null
  model: string
  maxSpend: number
  concurrency: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: false,
    limit: null,
    model: DEFAULT_MODEL,
    maxSpend: DEFAULT_MAX_SPEND,
    concurrency: DEFAULT_CONCURRENCY,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') args.dryRun = true
    else if (a === '--limit') args.limit = requireNum(a, argv[++i])
    else if (a === '--model') args.model = requireStr(a, argv[++i])
    else if (a === '--max-spend') args.maxSpend = requireNum(a, argv[++i])
    else if (a === '--concurrency') args.concurrency = requireNum(a, argv[++i])
    else { console.error(`Unknown arg: ${a}`); process.exit(1) }
  }
  return args
}

function requireNum(flag: string, raw: string | undefined): number {
  const n = Number(raw)
  if (raw === undefined || Number.isNaN(n)) { console.error(`${flag} needs a number`); process.exit(1) }
  return n
}
function requireStr(flag: string, raw: string | undefined): string {
  if (!raw) { console.error(`${flag} needs a value`); process.exit(1) }
  return raw
}

// ---- congress.gov text fetch (carried from prewarm) ------------------
interface TextVersion { date: string | null; type: string; formats: { type: string; url: string }[] }
type TextResult =
  | { kind: 'ok'; text: string; truncated: boolean }
  | { kind: 'no-text' }
  | { kind: 'error' }

function parseId(id: string) {
  const parts = id.split('-')
  const congress = parts.pop()!
  const number = parts.pop()!
  return { type: parts.join('-'), number, congress }
}

// Minimal HTML → text — copied verbatim from prewarm-bills.ts.
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const backoffMs = (attempt: number) => 1000 * 2 ** attempt + Math.floor(Math.random() * 250)

// Congress.gov fetch with 429 / 5xx / network retry + Retry-After honor.
// Returns null when the request is unrecoverable after MAX_RETRIES.
async function fetchWithRetry(url: string, label: string): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response
    try {
      res = await fetch(url, { cache: 'no-store' })
    } catch {
      if (attempt === MAX_RETRIES) { console.warn(`    ↳ ${label}: network error after ${attempt} retries`); return null }
      await sleep(backoffMs(attempt)); continue
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) { console.warn(`    ↳ ${label}: HTTP ${res.status} after ${attempt} retries`); return null }
      const retryAfter = Number(res.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt)
      console.warn(`    ↳ ${label}: HTTP ${res.status} — backoff ${Math.round(waitMs)}ms (attempt ${attempt + 1})`)
      await sleep(waitMs); continue
    }
    return res
  }
  return null
}

// Newest Formatted-Text version → plain text, capped. Distinguishes
// no-text (no usable version) from error (fetch failed) so the caller can
// log + skip no-text without faking a summary. Same selection logic as
// prewarm, now routed through fetchWithRetry.
async function fetchBillText(id: string): Promise<TextResult> {
  const { type, number, congress } = parseId(id)
  const listUrl = `${CONGRESS_BASE}/bill/${congress}/${type}/${number}/text?format=json&limit=250&api_key=${CONGRESS_KEY}`
  const listRes = await fetchWithRetry(listUrl, `${id} text-versions`)
  if (!listRes || !listRes.ok) return { kind: 'error' }
  const data = (await listRes.json()) as { textVersions?: TextVersion[] }
  const withFmt = (data.textVersions ?? [])
    .map((v) => ({ v, fmt: v.formats.find((f) => f.type === 'Formatted Text') }))
    .filter((x): x is { v: TextVersion; fmt: { type: string; url: string } } => Boolean(x.fmt))
  if (!withFmt.length) return { kind: 'no-text' }
  withFmt.sort((a, b) => String(b.v.date ?? '').localeCompare(String(a.v.date ?? '')))
  const htmlRes = await fetchWithRetry(withFmt[0].fmt.url, `${id} formatted-text`)
  if (!htmlRes || !htmlRes.ok) return { kind: 'error' }
  const full = htmlToText(await htmlRes.text())
  if (!full) return { kind: 'no-text' }
  return { kind: 'ok', text: full.slice(0, CAP_CHARS), truncated: full.length > CAP_CHARS }
}

// ---- summarization (prompt + model carried verbatim from prewarm) ----
const SYSTEM = `You translate U.S. federal legislation into plain language for ordinary citizens. You are factual, neutral, and strictly non-partisan. Explain what a bill actually does — its core provisions and who it affects — in clear everyday English. Base your explanation ONLY on the bill text provided; never invent provisions, dollar figures, dates, or effects that are not in the text. Do not editorialize, advocate, or use procedural jargon.`

async function summarize(model: string, title: string, text: string, truncated: boolean) {
  const note = truncated ? "\n\n(Note: the text below is truncated to the bill's opening sections.)" : ''
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Bill: ${title}${note}\n\nOfficial text:\n${text}\n\nWrite ONE plain-language paragraph (3–5 sentences) explaining what this bill does and who it affects, for someone with no legal or policy background. Lead with the core action, not the bill's name. Do not mention section numbers or procedural status. If this is only a short procedural resolution, say plainly what it approves or disapproves.`,
    }],
  })
  // Find-by-type (not [0]): the model may emit a non-text block first;
  // indexing [0] would silently drop the summary as "empty".
  const block = msg.content.find((b) => b.type === 'text')
  const out = block?.type === 'text' ? block.text.trim() : ''
  return { out, inT: msg.usage?.input_tokens ?? 0, outT: msg.usage?.output_tokens ?? 0 }
}

// ---- concurrency limiter (pattern from lib/bill-sync.ts; no p-limit) --
async function withConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  const workerCount = Math.min(concurrency, items.length)
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: workerCount }, worker))
}

// ---- main ------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2))
  const price = PRICES[args.model]
  if (!price) {
    console.error(`No price entry for model "${args.model}". Add it to PRICES so the cost log and --max-spend ceiling are accurate, then re-run.`)
    process.exit(1)
  }

  console.log(
    `backfill-summaries — model=${args.model} concurrency=${args.concurrency} ` +
    `max-spend=$${args.maxSpend.toFixed(2)} limit=${args.limit ?? 'none'} ` +
    `mode=${args.dryRun ? 'DRY-RUN (no Anthropic calls, no writes)' : 'LIVE (writes ai_summary)'}`,
  )

  // Selection: every still-null bill. Re-selecting on each run is what makes
  // an aborted run resumable — already-written rows drop out automatically.
  const { data, error } = await supabase
    .from('bills')
    .select('id, full_identifier, title, status, urgency_score')
    .is('ai_summary', null)
    .limit(SELECT_CAP)
  if (error) { console.error(`Selection failed: ${error.message}`); process.exit(1) }
  const rows = (data ?? []) as BillRow[]
  if (rows.length === SELECT_CAP) console.warn(`⚠ hit SELECT_CAP (${SELECT_CAP}) — some null bills may be unselected; raise the cap.`)

  // Most-advanced legislative stage first, urgency as the within-stage tiebreak.
  rows.sort((a, b) => {
    const ra = STAGE_RANK[a.status] ?? -1
    const rb = STAGE_RANK[b.status] ?? -1
    if (rb !== ra) return rb - ra
    return (b.urgency_score ?? 0) - (a.urgency_score ?? 0)
  })
  const queue = args.limit != null ? rows.slice(0, args.limit) : rows
  console.log(`Selected ${rows.length} null-summary bills; processing ${queue.length}.\n`)

  const counts: Record<Outcome, number> = {
    'summarized': 0, 'skipped-already-set': 0, 'skipped-no-text': 0, 'skipped-ceiling': 0, 'error': 0,
  }
  const noTextIds: string[] = []
  let spent = 0 // measured USD (live) — drives the ceiling
  let estimated = 0 // projected USD (dry-run)
  let aborted = false

  await withConcurrency(queue, args.concurrency, async (bill) => {
    if (aborted) { counts['skipped-ceiling']++; console.log(`⤬ ${bill.full_identifier} [${bill.id}] skipped — ceiling reached`); return }

    // Fresh re-check: another worker (or an earlier run) may have filled it.
    const { data: cur } = await supabase.from('bills').select('ai_summary').eq('id', bill.id).maybeSingle()
    if (cur?.ai_summary) { counts['skipped-already-set']++; console.log(`• ${bill.full_identifier} [${bill.id}] skipped — already set`); return }

    const fetched = await fetchBillText(bill.full_identifier)
    if (fetched.kind === 'no-text') { counts['skipped-no-text']++; noTextIds.push(bill.full_identifier); console.log(`▽ ${bill.full_identifier} [${bill.id}] skipped — no usable bill text`); return }
    if (fetched.kind === 'error') { counts['error']++; console.log(`✗ ${bill.full_identifier} [${bill.id}] error — text fetch failed`); return }

    // DRY-RUN: estimate from real text length, make ZERO Anthropic calls.
    if (args.dryRun) {
      const inT = Math.ceil(fetched.text.length / 4) + 200 // text + system/scaffold
      const c = (inT / 1e6) * price.in + (DRY_RUN_OUTPUT_TOKENS / 1e6) * price.out
      estimated += c
      counts['summarized']++ // "would summarize"
      console.log(`~ ${bill.full_identifier} [${bill.id}] est ${inT}+~${DRY_RUN_OUTPUT_TOKENS} tok, $${c.toFixed(4)} (cum est $${estimated.toFixed(4)})`)
      return
    }

    // LIVE: ceiling check BEFORE paying. Up to (concurrency-1) in-flight
    // calls may still land after the ceiling trips — keep concurrency low.
    if (spent >= args.maxSpend) { aborted = true; counts['skipped-ceiling']++; console.log(`⤬ ${bill.full_identifier} [${bill.id}] skipped — ceiling $${args.maxSpend.toFixed(2)} reached (spent $${spent.toFixed(4)})`); return }

    let result
    try {
      result = await summarize(args.model, bill.title, fetched.text, fetched.truncated)
    } catch (err) {
      counts['error']++; console.log(`✗ ${bill.full_identifier} [${bill.id}] error — ${err instanceof Error ? err.message : String(err)}`); return
    }
    if (!result.out) { counts['error']++; console.log(`✗ ${bill.full_identifier} [${bill.id}] error — empty model output, not writing`); return }

    const { error: upErr } = await supabase.from('bills').update({ ai_summary: result.out }).eq('id', bill.id)
    if (upErr) { counts['error']++; console.log(`✗ ${bill.full_identifier} [${bill.id}] error — write failed: ${upErr.message}`); return }

    const c = (result.inT / 1e6) * price.in + (result.outT / 1e6) * price.out
    spent += c; counts['summarized']++
    if (spent >= args.maxSpend) aborted = true
    console.log(`✓ ${bill.full_identifier} [${bill.id}] wrote ${result.out.length} chars${fetched.truncated ? ' (input truncated)' : ''} — ${result.inT}+${result.outT} tok, $${c.toFixed(4)} (cum $${spent.toFixed(4)})`)
  })

  // ---- final report ----
  console.log(`\n— done —`)
  console.log(`  summarized:${counts['summarized']} already-set:${counts['skipped-already-set']} no-text:${counts['skipped-no-text']} ceiling-skipped:${counts['skipped-ceiling']} errors:${counts['error']}`)
  console.log(args.dryRun ? `  estimated cost: $${estimated.toFixed(4)} (DRY-RUN — nothing written, no Anthropic calls)` : `  measured cost: $${spent.toFixed(4)}${aborted ? `  ⚠ ABORTED at ceiling $${args.maxSpend.toFixed(2)} — re-run to resume` : ''}`)
  if (noTextIds.length) console.log(`  no-text bills (left null, investigate): ${noTextIds.join(', ')}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
