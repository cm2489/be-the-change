const BASE = 'https://api.congress.gov/v3'

interface CongressBillSummary {
  congress: number
  type: string
  number: string
  title: string
  latestAction: { actionDate: string; text: string }
  url: string
}

interface CongressBillDetail {
  congress: number
  type: string
  number: string
  title: string
  latestAction: { actionDate: string; text: string }
  summaries?: { count: number; url: string }
  policyArea?: { name: string }
}

async function congressFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '20')
  url.searchParams.set('api_key', process.env.CONGRESS_API_KEY ?? 'DEMO_KEY')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Congress.gov API error: ${res.status} ${res.statusText} — ${body}`)
  }

  return res.json()
}

// Returns bills updated since fromDate (ISO string)
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

export function mapCongressStatus(actionText: string): string {
  const text = actionText.toLowerCase()
  if (text.includes('became public law') || text.includes('signed by president')) return 'signed'
  if (text.includes('vetoed')) return 'vetoed'
  if (text.includes('passed')) return 'passed_chamber'
  if (text.includes('committee')) return 'committee'
  if (text.includes('introduced')) return 'introduced'
  return 'introduced'
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
    if (days < 0) return 0.3
    if (days <= 3) return 1.0
    if (days <= 7) return 0.85
    if (days <= 30) return 0.65
    return 0.45
  }
  if (status === 'passed_chamber') return 0.6
  if (status === 'committee') return 0.4
  if (lastActionDate) {
    const daysSinceAction = (Date.now() - new Date(lastActionDate).getTime()) / 86_400_000
    if (daysSinceAction < 7) return 0.35
  }
  return 0.2
}
