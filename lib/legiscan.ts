const BASE = 'https://api.legiscan.com/'

interface LegiScanResponse<T> {
  status: 'OK' | 'ERROR'
  masterlist?: T
  sessions?: T
  bill?: T
  alert?: { message: string }
}

export interface LegiScanBillSummary {
  bill_id: number
  bill_number: string
  change_hash: string
  status: number
  last_action_date: string
  last_action: string
  title: string
  url: string
}

export interface LegiScanBillDetail {
  bill_id: number
  bill_number: string
  title: string
  description: string
  state: string
  session: { session_id: number; year_start: number; year_end: number }
  status: number
  last_action_date: string
  last_action: string
  url: string
  texts: Array<{ doc_id: number; url: string; type: string }>
  votes: Array<{ roll_id: number; date: string; desc: string; chamber: string }>
}

interface LegiScanSession {
  session_id: number
  year_start: number
  prior: number
}

async function legiscanFetch<T>(
  op: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.LEGISCAN_API_KEY
  if (!apiKey) throw new Error('LEGISCAN_API_KEY not set')

  const url = new URL(BASE)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('op', op)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  const json: LegiScanResponse<T> = await res.json()

  if (json.status !== 'OK') {
    throw new Error(`LegiScan error for op=${op}: ${json.alert?.message ?? 'Unknown'}`)
  }

  const key = op === 'getSessionList'
    ? 'sessions'
    : op === 'getMasterList'
    ? 'masterlist'
    : 'bill'

  return json[key as keyof LegiScanResponse<T>] as T
}

export async function getSessionId(stateCode: string): Promise<number> {
  const sessions = await legiscanFetch<LegiScanSession[]>('getSessionList', {
    state: stateCode,
  })
  const current = sessions.find(s => s.prior === 0)
  if (!current) throw new Error(`No active session for ${stateCode}`)
  return current.session_id
}

export async function getMasterList(
  sessionId: number
): Promise<Record<string, LegiScanBillSummary>> {
  return legiscanFetch<Record<string, LegiScanBillSummary>>('getMasterList', {
    id: String(sessionId),
  })
}

export async function getBillDetail(billId: number): Promise<LegiScanBillDetail> {
  return legiscanFetch<LegiScanBillDetail>('getBill', { id: String(billId) })
}

// Maps LegiScan numeric status codes to our schema string enum
export function mapLegiScanStatus(status: number): string {
  const map: Record<number, string> = {
    1: 'introduced',
    2: 'committee',
    3: 'committee',
    4: 'passed_chamber',
    5: 'enrolled',
    6: 'signed',
    7: 'vetoed',
    8: 'failed',
  }
  return map[status] ?? 'introduced'
}

export function computeLegiScanUrgency(
  status: number,
  voteDate?: string
): number {
  if (voteDate) {
    const days = (new Date(voteDate).getTime() - Date.now()) / 86_400_000
    if (days < 0) return 0.3
    if (days <= 3) return 1.0
    if (days <= 7) return 0.85
    if (days <= 30) return 0.65
    return 0.45
  }
  if (status >= 4) return 0.6
  if (status >= 2) return 0.4
  return 0.2
}
