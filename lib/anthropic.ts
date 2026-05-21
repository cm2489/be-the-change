import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'

// ANTHROPIC_BASE_URL is unset in prod; set in tests to point the SDK at
// a local mock if/when one lands. Conditional spread keeps the prod call
// path unchanged.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
})

// The canonical stance enum lives on the script_generations CHECK
// constraint (migration 002). Keep these in lockstep — a mismatch here
// fails at insert time, not at type-check time.
export type Stance = 'support' | 'oppose' | 'undecided'

export interface ScriptRequest {
  billTitle: string
  billSummary: string
  userName: string
  userInterests: string[]
  stance: Stance
}

export interface GeneratedScript {
  scriptText: string
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  promptHash: string
}

// Model pricing for cost_usd persistence. Numbers are USD per 1M tokens
// from Anthropic's public pricing page; update here on price changes.
// Unknown models log a warning and return 0 cost — the script_generations
// row still inserts (cost is an audit field, not load-bearing), and the
// hard daily cap is enforced at the Anthropic dashboard level per
// CLAUDE.md, not in this code path.
const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  'claude-haiku-4-5': { inputPerMillion: 1, outputPerMillion: 5 },
  'claude-haiku-4-5-20251001': { inputPerMillion: 1, outputPerMillion: 5 },
}

const SCRIPT_MODEL = 'claude-haiku-4-5'

export function computeCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) {
    console.warn(`[anthropic] unknown model ${model} — cost_usd will be recorded as 0`)
    return 0
  }
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion
  // Round to 6 decimal places to match numeric(10,6) on script_generations.
  // Postgres rejects the row outright if precision overflows; rounding here
  // keeps the route from 500ing on a microcent of float drift.
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000
}

const SYSTEM_PROMPT = `You are a civic engagement assistant helping everyday Americans contact their elected officials.
Generate scripts that are respectful, clear, and effective.
Never aggressive or partisan — focus on the specific issue and a clear ask.
Do not add disclaimers, explanations, or meta-commentary — just the script itself.`

const PHONE_INSTRUCTIONS = `Generate a phone call script. Keep it under 60 seconds when read aloud (approximately 120-130 words). Include: brief greeting, who you are and your city, the issue, a clear ask, and a polite thank you. Sound natural and conversational, not robotic.`

// Build the user prompt deterministically — input order matters for the
// SHA-256 hash to be stable across calls with identical inputs.
function buildUserPrompt(req: ScriptRequest): string {
  const lines: string[] = [PHONE_INSTRUCTIONS, '']
  lines.push(`Bill: ${req.billTitle}`)
  if (req.billSummary) lines.push(`Context: ${req.billSummary}`)
  lines.push(`Stance: ${req.stance}`)
  lines.push(`Constituent's name: ${req.userName}`)
  if (req.userInterests.length > 0) {
    lines.push(`Constituent's priority issues: ${req.userInterests.join(', ')}`)
  }
  // Rep-agnostic per the canonical cache key (user_id, bill_id, stance) —
  // the model is told to use a generic salutation and the constituent
  // fills in the actual name during the "Save & Review" step.
  // See docs/deferred.md#feature-4-rep-personalization.
  lines.push('')
  lines.push('Address the recipient as "Representative" — the constituent will fill in the actual name.')
  lines.push('')
  lines.push('Write the script now:')
  return lines.join('\n')
}

export async function generateScript(req: ScriptRequest): Promise<GeneratedScript> {
  const userPrompt = buildUserPrompt(req)
  // Hash the concatenation of system + user prompt. If the system prompt
  // changes in a future deploy, new generations land with a different
  // hash; the cache key (user_id, bill_id, stance) is unchanged so old
  // rows keep serving — that's intentional. The hash exists as an audit
  // signal, not as a cache invalidator.
  const promptHash = createHash('sha256')
    .update(`${SYSTEM_PROMPT}\n\n${userPrompt}`)
    .digest('hex')

  const message = await client.messages.create({
    model: SCRIPT_MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT,
  })

  const scriptText =
    message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

  const inputTokens = message.usage?.input_tokens ?? 0
  const outputTokens = message.usage?.output_tokens ?? 0
  const costUsd = computeCostUsd(SCRIPT_MODEL, inputTokens, outputTokens)

  return {
    scriptText,
    model: SCRIPT_MODEL,
    inputTokens,
    outputTokens,
    costUsd,
    promptHash,
  }
}

// Plain-English bill summary for the feed/detail surface. Unchanged from
// the pre-Feature-4 shape — different surface, no script_generations
// involvement.
export async function summarizeBill(title: string, rawSummary: string): Promise<string> {
  const message = await client.messages.create({
    model: SCRIPT_MODEL,
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Summarize this legislation in 1-2 plain-English sentences that a non-expert can understand.
Be factual and neutral. Do not editorialize.

Title: ${title}
Summary: ${rawSummary}

Plain-English summary:`,
      },
    ],
  })

  return message.content[0]?.type === 'text'
    ? message.content[0].text.trim()
    : rawSummary
}
