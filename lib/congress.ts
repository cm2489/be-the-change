const BASE = 'https://api.congress.gov/v3'

interface CongressBillSummary {
  congress: number
  type: string
  number: string
  title: string
  latestAction: { actionDate: string; text: string }
  url: string
}

async function congressFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '250')
  url.searchParams.set('api_key', process.env.CONGRESS_API_KEY ?? 'DEMO_KEY')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Congress.gov API error: ${res.status} ${res.statusText} — ${body}`)
  }

  return res.json()
}

export async function getRecentBills(): Promise<CongressBillSummary[]> {
  const data = await congressFetch<{ bills: CongressBillSummary[] }>('/bill', {
    sort: 'updateDate',
    direction: 'desc',
  })
  return data.bills ?? []
}

export interface NormalizedFederalBill {
  external_id: string
  source: 'congress'
  level: 'federal'
  state_code: null
  bill_number: string
  title: string
  summary: string | null
  full_text_url: string
  status: string
  vote_date: string | null
  last_action: string
  last_action_date: string
  urgency_score: number
}

// Returns true for bills actively moving — markup stage or later
export function isActionableBill(actionText: string): boolean {
  const text = actionText.toLowerCase()
  return (
    text.includes('markup') ||
    text.includes('ordered to be reported') ||
    text.includes('placed on') ||
    text.includes('legislative calendar') ||
    text.includes('scheduled for') ||
    text.includes('floor consideration') ||
    text.includes('cloture') ||
    text.includes('vote scheduled') ||
    text.includes('motion to proceed') ||
    text.includes('rule providing for') ||
    text.includes('passed house') ||
    text.includes('passed senate') ||
    text.includes('passed/agreed to') ||
    text.includes('agreed to in') ||
    text.includes('received in the senate') ||
    text.includes('received in the house') ||
    text.includes('signed by president') ||
    text.includes('became public law') ||
    text.includes('vetoed') ||
    text.includes('conference report')
  )
}

export function mapCongressStatus(actionText: string): string {
  const text = actionText.toLowerCase()
  if (text.includes('became public law') || text.includes('signed by president')) return 'signed'
  if (text.includes('vetoed')) return 'vetoed'
  if (text.includes('conference report')) return 'conference'
  if (text.includes('passed house') || text.includes('passed senate') ||
      text.includes('passed/agreed to') || text.includes('agreed to in') ||
      text.includes('received in the senate') || text.includes('received in the house')) return 'passed_chamber'
  if (text.includes('cloture') || text.includes('motion to proceed') ||
      text.includes('floor consideration') || text.includes('vote scheduled') ||
      text.includes('placed on') || text.includes('legislative calendar') ||
      text.includes('rule providing for') || text.includes('scheduled for')) return 'floor_vote'
  if (text.includes('markup') || text.includes('ordered to be reported')) return 'markup'
  return 'committee'
}

export function mapCongressBill(bill: CongressBillSummary): NormalizedFederalBill {
  const congressNum = bill.congress ?? 119
  const externalId = `congress-${bill.type?.toLowerCase()}-${bill.number}-${congressNum}`
  const status = mapCongressStatus(bill.latestAction?.text ?? '')

  return {
    external_id: externalId,
    source: 'congress',
    level: 'federal',
    state_code: null,
    bill_number: `${bill.type} ${bill.number}`,
    title: bill.title,
    summary: null,
    full_text_url: bill.url,
    status,
    vote_date: null,
    last_action: bill.latestAction?.text ?? '',
    last_action_date: bill.latestAction?.actionDate ?? '',
    urgency_score: computeUrgencyScore(status, null, bill.latestAction?.actionDate),
  }
}

function computeUrgencyScore(
  status: string,
  voteDate: string | null,
  lastActionDate?: string
): number {
  if (voteDate) {
    const days = (new Date(voteDate).getTime() - Date.now()) / 86_400_000
    if (days <= 1) return 1.0
    if (days <= 3) return 0.95
    if (days <= 7) return 0.85
    if (days <= 30) return 0.65
    return 0.45
  }
  if (status === 'signed') return 0.3
  if (status === 'passed_chamber' || status === 'conference') return 0.75
  if (status === 'floor_vote') return 0.9
  if (status === 'markup') return 0.65
  if (lastActionDate) {
    const days = (Date.now() - new Date(lastActionDate).getTime()) / 86_400_000
    if (days < 3) return 0.55
    if (days < 7) return 0.45
  }
  return 0.3
}
