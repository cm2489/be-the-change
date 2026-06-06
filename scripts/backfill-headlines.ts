/**
 * scripts/backfill-headlines.ts — one-off feed-card headline backfill.
 *
 * Generates ONE short editorial headline per bill FROM its existing
 * `bills.ai_summary` (NOT the bill text) and writes it to `bills.ai_headline`
 * (added in migration 009). This is the V4 feed-card "Decoded" headline
 * (docs/DESIGN_DECISIONS.md → "Bill feed card (V4)").
 *
 * Generalized from scripts/backfill-summaries.ts. Because the source is the
 * already-stored summary, there is NO Congress.gov text fetch — just read
 * ai_summary, call Anthropic, write ai_headline. Much cheaper per call.
 *
 * Selection: bills WHERE ai_headline IS NULL, ordered most-advanced
 * legislative stage first (STAGE_RANK desc, urgency_score desc) so a small
 * --limit run hits the highest-value head of the feed (the near-identical
 * floor_vote CRA disapproval cluster — the hardest distinctness test).
 * Idempotent: re-selects only still-null rows, so it resumes after an abort.
 * Bills with NULL ai_summary are skipped + logged (no summary => no headline),
 * never faked.
 *
 * Dry run (estimate only, ZERO Anthropic calls, ZERO writes):
 *   npx tsx --env-file=.env.local scripts/backfill-headlines.ts --dry-run --limit 8
 * Small live sample (writes ~8 ai_headline rows, hard $1 ceiling):
 *   npx tsx --env-file=.env.local scripts/backfill-headlines.ts --limit 8 --max-spend 1
 * Full backfill (only after Colby approves the spend):
 *   npx tsx --env-file=.env.local scripts/backfill-headlines.ts --max-spend 5
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ---- config ----------------------------------------------------------
const DEFAULT_MODEL = 'claude-sonnet-4-6' // locked: headline model
const DEFAULT_MAX_SPEND = 5 // USD; hard ceiling, overridable via --max-spend
const DEFAULT_CONCURRENCY = 3 // each bill = 1 Anthropic call (no text fetch)
const DRY_RUN_OUTPUT_TOKENS = 30 // assumed headline output for the dry-run estimate
const SELECT_CAP = 5000 // safety cap on the null-set fetch

// List prices, USD per 1M tokens. Drives the cost log AND the --max-spend
// ceiling, so an unknown model aborts rather than mis-estimating.
const PRICES: Record<string, { in: number; out: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-haiku-4-5': { in: 1, out: 5 },
}

// Legislative-advancement rank — "most advanced first" (JS sort, not the
// alphabetical status column). urgency_score is the within-stage tiebreak.
const STAGE_RANK: Record<string, number> = {
  signed: 6, floor_vote: 5, passed_chamber: 4, conference: 4,
  markup: 3, committee: 2, introduced: 1, vetoed: 0,
}

type Outcome =
  | 'headlined'
  | 'skipped-already-set'
  | 'skipped-no-summary'
  | 'skipped-ceiling'
  | 'error'

interface BillRow {
  id: string
  full_identifier: string
  title: string
  status: string
  urgency_score: number | null
  ai_summary: string | null
}

// ---- env + clients ---------------------------------------------------
function env(name: string): string {
  const v = process.env[name]
  if (!v) { console.error(`Missing env: ${name}`); process.exit(1) }
  return v
}

const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
// maxRetries: the SDK retries 429/5xx with exponential backoff + Retry-After.
// Transparent — create() returns only the final successful message (with its
// usage), so cost accounting counts each call exactly once.
const anthropic = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY'), maxRetries: 8 })

// ---- args ------------------------------------------------------------
interface Args { dryRun: boolean; limit: number | null; only: string[] | null; model: string; maxSpend: number; concurrency: number }

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, limit: null, only: null, model: DEFAULT_MODEL, maxSpend: DEFAULT_MAX_SPEND, concurrency: DEFAULT_CONCURRENCY }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') args.dryRun = true
    else if (a === '--limit') args.limit = requireNum(a, argv[++i])
    // --only <csv of full_identifiers>: regenerate EXACTLY these bills (deterministic
    // targeting; ignores --limit/stage-sort). Use to re-sample a known set.
    else if (a === '--only') args.only = requireStr(a, argv[++i]).split(',').map(s => s.trim()).filter(Boolean)
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

// ---- headline generation (prompt LOCKED) -----------------------------
// Carried verbatim from the V4 mockup generation that produced the approved
// sample (0 over 90 chars, 0 led with "Congress"). Source = the bill's
// ai_summary; output = one "Topic Label — Action" headline.
const SYSTEM = `You write short, neutral headlines for a nonpartisan civic app that helps people understand U.S. federal bills. Every bill here is already a congressional bill, so NEVER begin a headline with the word "Congress" — it is redundant and must never be the first word.

Given a plain-language summary of ONE bill, write ONE headline in EXACTLY this format:

Specific Topic Label — What Is Happening

Rules:
- The topic label (before the em dash) names the SPECIFIC subject — the agency, program, or rule involved — so two bills about different rules never share a headline.
- After the em dash (—), state the concrete action or outcome. Distinctness comes from the specific TOPIC label before the em dash (agency + rule); the action half does NOT need to be forced-varied across similar bills.
- Title Case: capitalize the principal words.
- Keep the WHOLE headline to 80 characters or fewer, and NEVER exceed 90. Be concise: a short topic label, a short action half, and NO comma-lists in the action.
- Strictly nonpartisan and neutral: no praise, no alarm, no advocacy, no loaded verbs (no "Guts", "Cracks Down", "Protects", "Attacks", "Slashes", "Defends").
- No bill numbers, no quotation marks, and no procedural jargon. Banned words/phrases include "Congressional Disapproval", "Joint Resolution", bare "Resolution"/"Resolutions", "Pursuant To", "Chapter 8 of Title 5". Describe what the bill DOES, not the legislative vehicle it rides on.
- Never begin with "Congress".

Output ONLY the headline text.`

async function makeHeadline(model: string, summary: string) {
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 60,
    temperature: 0.3,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Summary:\n${summary}` }],
  })
  const block = msg.content.find((b) => b.type === 'text')
  const raw = block?.type === 'text' ? block.text : ''
  const out = raw.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim()
  return { out, inT: msg.usage?.input_tokens ?? 0, outT: msg.usage?.output_tokens ?? 0 }
}

// A multi-line / absurdly-long output is the model spilling its reasoning, not a
// headline — never write that (asking the model to "count characters" provoked it).
function isLeak(s: string): boolean {
  return s.includes('\n') || s.length > 130
}

// Hard guarantee on the 90-char cap: if a clean headline still overruns, truncate
// at the last word boundary (no ellipsis — a clipped action half still reads).
function clampLength(s: string): { text: string; truncated: boolean } {
  const t = s.trim()
  if (t.length <= 90) return { text: t, truncated: false }
  const cut = t.slice(0, 90)
  const lastSpace = cut.lastIndexOf(' ')
  const text = (lastSpace > 50 ? cut.slice(0, lastSpace) : cut).replace(/[\s—–,;:-]+$/u, '')
  return { text, truncated: true }
}

// ---- concurrency limiter (pattern from lib/bill-sync.ts; no p-limit) --
async function withConcurrency<T>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  const workerCount = Math.min(concurrency, items.length)
  const worker = async () => { while (next < items.length) { const i = next++; await fn(items[i]) } }
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
    `backfill-headlines — model=${args.model} concurrency=${args.concurrency} ` +
    `max-spend=$${args.maxSpend.toFixed(2)} limit=${args.limit ?? 'none'} ` +
    `mode=${args.dryRun ? 'DRY-RUN (no Anthropic calls, no writes)' : 'LIVE (writes ai_headline)'}`,
  )

  // Selection: every still-null-headline bill (idempotent re-select).
  const { data, error } = await supabase
    .from('bills')
    .select('id, full_identifier, title, status, urgency_score, ai_summary')
    .is('ai_headline', null)
    .limit(SELECT_CAP)
  if (error) { console.error(`Selection failed: ${error.message}`); process.exit(1) }
  const rows = (data ?? []) as BillRow[]
  if (rows.length === SELECT_CAP) console.warn(`⚠ hit SELECT_CAP (${SELECT_CAP}) — raise the cap.`)

  // --only: regenerate exactly the named bills (deterministic; ignores --limit).
  // Otherwise: most-advanced stage first, then urgency, then id. The id tiebreak
  // makes --limit deterministic regardless of DB return order — the missing
  // tiebreak is what let an earlier re-sample drift onto a different 8.
  let queue: BillRow[]
  if (args.only) {
    const want = new Set(args.only)
    queue = rows.filter((r) => want.has(r.full_identifier))
    const got = new Set(queue.map((r) => r.full_identifier))
    const missing = args.only.filter((id) => !got.has(id))
    if (missing.length) console.warn(`⚠ --only: ${missing.length} not in the null-headline set (already set or unknown), skipped: ${missing.join(', ')}`)
  } else {
    rows.sort((a, b) => {
      const ra = STAGE_RANK[a.status] ?? -1
      const rb = STAGE_RANK[b.status] ?? -1
      if (rb !== ra) return rb - ra
      const ua = a.urgency_score ?? 0, ub = b.urgency_score ?? 0
      if (ub !== ua) return ub - ua
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    })
    queue = args.limit != null ? rows.slice(0, args.limit) : rows
  }
  console.log(`Selected ${rows.length} null-headline bills; processing ${queue.length}.\n`)

  const counts: Record<Outcome, number> = {
    'headlined': 0, 'skipped-already-set': 0, 'skipped-no-summary': 0, 'skipped-ceiling': 0, 'error': 0,
  }
  const noSummaryIds: string[] = []
  const truncatedIds: string[] = []
  let spent = 0      // measured USD (live) — drives the ceiling
  let estimated = 0  // projected USD (dry-run)
  let aborted = false

  await withConcurrency(queue, args.concurrency, async (bill) => {
    if (aborted) { counts['skipped-ceiling']++; console.log(`⤬ ${bill.full_identifier} skipped — ceiling reached`); return }

    if (!bill.ai_summary || !bill.ai_summary.trim()) {
      counts['skipped-no-summary']++; noSummaryIds.push(bill.full_identifier)
      console.log(`▽ ${bill.full_identifier} skipped — no ai_summary to headline`); return
    }

    // Fresh re-check: another worker (or earlier run) may have filled it.
    const { data: cur } = await supabase.from('bills').select('ai_headline').eq('id', bill.id).maybeSingle()
    if (cur?.ai_headline) { counts['skipped-already-set']++; console.log(`• ${bill.full_identifier} skipped — already set`); return }

    // DRY-RUN: estimate from the summary length, ZERO Anthropic calls.
    if (args.dryRun) {
      const inT = Math.ceil(bill.ai_summary.length / 4) + 250 // summary + system prompt
      const c = (inT / 1e6) * price.in + (DRY_RUN_OUTPUT_TOKENS / 1e6) * price.out
      estimated += c; counts['headlined']++
      console.log(`~ ${bill.full_identifier} est ${inT}+~${DRY_RUN_OUTPUT_TOKENS} tok, $${c.toFixed(4)} (cum est $${estimated.toFixed(4)})`)
      return
    }

    // LIVE: ceiling check BEFORE paying.
    if (spent >= args.maxSpend) { aborted = true; counts['skipped-ceiling']++; console.log(`⤬ ${bill.full_identifier} skipped — ceiling $${args.maxSpend.toFixed(2)} reached`); return }

    let result
    try {
      result = await makeHeadline(args.model, bill.ai_summary)
    } catch (err) {
      counts['error']++; console.log(`✗ ${bill.full_identifier} error — ${err instanceof Error ? err.message : String(err)}`); return
    }
    if (!result.out) { counts['error']++; console.log(`✗ ${bill.full_identifier} error — empty model output, not writing`); return }
    if (isLeak(result.out)) { counts['error']++; console.log(`✗ ${bill.full_identifier} error — model leaked reasoning (multi-line / over-long), not writing`); return }

    const { text: finalHeadline, truncated } = clampLength(result.out)
    const { error: upErr } = await supabase.from('bills').update({ ai_headline: finalHeadline }).eq('id', bill.id)
    if (upErr) { counts['error']++; console.log(`✗ ${bill.full_identifier} error — write failed: ${upErr.message}`); return }

    const c = (result.inT / 1e6) * price.in + (result.outT / 1e6) * price.out
    spent += c; counts['headlined']++
    if (truncated) truncatedIds.push(bill.full_identifier)
    if (spent >= args.maxSpend) aborted = true
    const flag = (truncated ? ' [hard-truncated]' : '') +
      (/^congress\b/i.test(finalHeadline) ? ' ⚠LEADS-CONGRESS' : '') +
      (finalHeadline.length > 90 ? ' ⚠STILL>90c' : '')
    console.log(`✓ ${bill.full_identifier} (${finalHeadline.length}c) ${result.inT}+${result.outT} tok $${c.toFixed(4)} cum $${spent.toFixed(4)}${flag}\n     ${finalHeadline}`)
  })

  // ---- final report ----
  console.log(`\n— done —`)
  console.log(`  headlined:${counts['headlined']} already-set:${counts['skipped-already-set']} no-summary:${counts['skipped-no-summary']} ceiling-skipped:${counts['skipped-ceiling']} errors:${counts['error']}`)
  console.log(args.dryRun
    ? `  estimated cost: $${estimated.toFixed(4)} (DRY-RUN — nothing written, no Anthropic calls)`
    : `  measured cost: $${spent.toFixed(4)}${aborted ? `  ⚠ ABORTED at ceiling $${args.maxSpend.toFixed(2)} — re-run to resume` : ''}`)
  if (noSummaryIds.length) console.log(`  no-summary bills (left null): ${noSummaryIds.join(', ')}`)
  if (truncatedIds.length) console.log(`  hard-truncated to fit 90c (${truncatedIds.length}): ${truncatedIds.join(', ')}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
