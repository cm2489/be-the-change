// CONGRESS_API_BASE_URL is overridable for tests (Playwright points it at a
// local mock server). Production leaves it unset and we hit Congress.gov.
const BASE = process.env.CONGRESS_API_BASE_URL ?? 'https://api.congress.gov/v3'

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

// ============================================================
// Members — federal House + Senate lookup
// ============================================================

// Congress 119 runs Jan 3 2025 → Jan 3 2027. In general,
// Congress N = floor((year - 1789) / 2) + 1, flipping on Jan 3 of
// each odd year (20th Amendment). For the two-day window of Jan 1–2
// in an odd year, the incoming Congress has not yet convened, so we
// stick with the outgoing one.
export function currentCongress(now: Date = new Date()): number {
  const year = now.getFullYear()
  const base = Math.floor((year - 1789) / 2) + 1
  const beforeJan3 = now.getMonth() === 0 && now.getDate() < 3
  if (year % 2 === 1 && beforeJan3) return base - 1
  return base
}

// Congress.gov's member-by-district endpoint rejects "at-large" in the
// path param — verified against the live API on 2026-04-24. Wyoming-
// style single-district states must use "0". geocode.ts returns the
// raw OCD-ID value ("at-large" for these), and we translate here.
function districtForPath(district: string): string {
  return district === 'at-large' ? '0' : district
}

export interface CongressMemberListItem {
  bioguideId: string
  name: string
  partyName: string
  state: string
  district?: number
  depiction?: { imageUrl?: string; attribution?: string }
  terms?: {
    item: Array<{
      chamber: 'House of Representatives' | 'Senate'
      startYear: number
      endYear?: number
    }>
  }
  url: string
}

export interface CongressMemberDetail {
  bioguideId: string
  directOrderName: string
  firstName: string
  lastName: string
  state: string
  partyHistory: Array<{
    partyAbbreviation: string
    partyName: string
    startYear: number
  }>
  addressInformation?: {
    phoneNumber?: string
    officeAddress?: string
  }
  officialWebsiteUrl?: string
  depiction?: { imageUrl?: string; attribution?: string }
  terms: Array<{
    chamber: 'House of Representatives' | 'Senate'
    congress: number
    startYear: number
    endYear?: number
    stateCode: string
    memberType: 'Representative' | 'Senator'
  }>
}

interface MemberListResponse {
  members: CongressMemberListItem[]
}

interface MemberDetailResponse {
  member: CongressMemberDetail
}

// Returns null on 404 OR HTTP 200 with an empty `members` array.
// null means "vacant seat" — pending special election, or a newly
// sworn-in member whose Congress.gov profile hasn't synced yet.
// Callers MUST tolerate this: do not insert a user_representatives
// row for `house`, show the seat as vacant in the UI.
// See docs/deferred.md#feature-2-vacant-seats.
//
// URL/fetch body duplicates congressFetch because we need 404 as a
// tolerated outcome rather than a thrown error. If 404-as-null is
// ever needed elsewhere, refactor both together.
export async function getHouseMemberByDistrict(
  stateCode: string,
  district: string,
  congress: number = currentCongress(),
): Promise<CongressMemberListItem | null> {
  const path = `/member/congress/${congress}/${stateCode.toUpperCase()}/${districtForPath(district)}`
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('currentMember', 'true')
  url.searchParams.set('api_key', process.env.CONGRESS_API_KEY ?? 'DEMO_KEY')

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Congress.gov API error: ${res.status} ${res.statusText} — ${body}`)
  }
  const data = (await res.json()) as MemberListResponse
  return data.members?.[0] ?? null
}

// Returns 0, 1, or 2 senators. Anything less than 2 means a vacant
// Senate seat (pending gubernatorial appointment or special election).
// Callers MUST tolerate short arrays — do not assume senators[0] and
// senators[1] both exist. See docs/deferred.md#feature-2-vacant-seats.
//
// The chamber filter uses terms.item[0].chamber === 'Senate', which
// assumes the list endpoint returns current-congress terms first. For
// a current senator who previously served in the House (rare in
// modern US politics, but not impossible), this filter could wrongly
// exclude them. Revisit if we see real-world senator-count mismatches.
// See docs/deferred.md#feature-2-senate-chamber-filter.
export async function getSenatorsByState(
  stateCode: string,
  congress: number = currentCongress(),
): Promise<CongressMemberListItem[]> {
  const data = await congressFetch<MemberListResponse>(
    `/member/congress/${congress}/${stateCode.toUpperCase()}`,
    { currentMember: 'true' },
  )
  return (data.members ?? []).filter(
    m => m.terms?.item?.[0]?.chamber === 'Senate',
  )
}

export async function getMemberDetail(bioguideId: string): Promise<CongressMemberDetail> {
  const data = await congressFetch<MemberDetailResponse>(`/member/${bioguideId}`)
  return data.member
}

// Sort comparator — use as `senators.sort(compareSenatorSeniority)[0]`
// to pick the senior senator. Bakes in the full tiebreak rule so
// callers can't forget it.
//
// Seniority is the earliest Senate-only startYear. A House-rep-turned-
// senator has low Senate seniority even with decades of House service.
// Tie-breaker (same swear-in year/day): alphabetical by lastName —
// deterministic and stable, without requiring data Congress.gov
// doesn't expose. See docs/deferred.md#feature-2-senate-seniority-tiebreak.
export function compareSenatorSeniority(
  a: CongressMemberDetail,
  b: CongressMemberDetail,
): number {
  const yearA = earliestSenateStart(a)
  const yearB = earliestSenateStart(b)
  if (yearA !== yearB) return yearA - yearB
  return a.lastName.localeCompare(b.lastName)
}

function earliestSenateStart(detail: CongressMemberDetail): number {
  const senateStarts = detail.terms
    .filter(t => t.chamber === 'Senate')
    .map(t => t.startYear)
  return senateStarts.length === 0 ? Number.MAX_SAFE_INTEGER : Math.min(...senateStarts)
}
