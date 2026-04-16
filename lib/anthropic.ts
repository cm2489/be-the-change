import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ScriptRequest {
  billTitle: string
  billSummary: string
  repName: string
  repTitle: string
  userName: string
  userInterests: string[]
  scriptType: 'phone' | 'email' | 'town_hall'
  stance?: 'support' | 'oppose' | 'concerned'
}

export interface GeneratedScript {
  content: string
  wordCount: number
}

const TYPE_INSTRUCTIONS = {
  phone: 'Generate a phone call script. Keep it under 60 seconds when read aloud (approximately 120-130 words). Include: brief greeting, who you are and your city, the issue, a clear ask, and a polite thank you. Sound natural and conversational, not robotic.',
  email: 'Generate an email script. Include a subject line on the first line (format: "Subject: ..."), then a blank line, then the email body (under 200 words). Professional but personable tone.',
  town_hall: 'Generate a town hall question script. Under 30 seconds when read aloud (~60 words). One focused, respectful question that invites a substantive response.',
}

export async function generateScript(req: ScriptRequest): Promise<GeneratedScript> {
  const systemPrompt = `You are a civic engagement assistant helping everyday Americans contact their elected officials.
Generate scripts that are respectful, clear, and effective.
Never aggressive or partisan — focus on the specific issue and a clear ask.
Do not add disclaimers, explanations, or meta-commentary — just the script itself.`

  const userPrompt = `${TYPE_INSTRUCTIONS[req.scriptType]}

Issue: ${req.billTitle}
${req.billSummary ? `Context: ${req.billSummary}` : ''}
Representative: ${req.repTitle} ${req.repName}
Constituent's name: ${req.userName}
Stance: ${req.stance ?? 'concerned'}

Write the script now:`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const content = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  const wordCount = content.split(/\s+/).filter(Boolean).length

  return { content, wordCount }
}

// Generate a plain-English summary of a bill for display to users
export async function summarizeBill(title: string, rawSummary: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
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

  return message.content[0].type === 'text'
    ? message.content[0].text.trim()
    : rawSummary
}
