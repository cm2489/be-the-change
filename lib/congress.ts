import { tagBill } from './bill-tagger'

// CONGRESS_API_BASE_URL is overridable for tests (Playwright points it at a
// local mock server). Production leaves it unset and we hit Congress.gov.
const BASE = process.env.CONGRESS_API_BASE_URL ?? 'https://api.congress.gov/v3'

async function congressFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '250')
  url.searchParams.set('api_key', process.env.CONGRESS_API_KEY ?? 'DEMO_KEY')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  return fetchWithRetry<T>(url.toString())
}

// Single retry with 500ms backoff on transient socket failures
// (`UND_ERR_SOCKET` / "terminated"). Congress.gov drops sockets on
// deep pagination ranges intermittently; a one-shot retry recovers
// without needing to fail the whole sync.
//
// `cache: 'no-store'` disables Next.js's fetch cache layer. Sync code
// always wants fresh data per cron run, and the cache layer was
// surfacing its own "terminated" errors on top of any underlying
// socket failure (see Phase 3a end-of-phase notes).
async function fetchWithRetry<T>(urlStr: string): Promise<T> {
  const doFetch = async () => {
    const res = await fetch(urlStr, { cache: 'no-store' })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Congress.gov API error: ${res.status} ${res.statusText} — ${body}`,
      )
    }
    return (await res.json()) as T
  }

  try {
    return await doFetch()
  } catch (err) {
    const isTransient =
      err instanceof TypeError ||
      (err instanceof Error && /terminated|socket|ECONNRESET|fetch failed/i.test(err.message))
    if (!isTransient) throw err
    await new Promise(r => setTimeout(r, 500))
    return await doFetch()
  }
}

// ============================================================
// Bill ingestion — types
// ============================================================

// Canonical bill record matching the post-002 `bills` schema (with the
// Phase 2 additions of `urgency_score` and `issue_tags` as a flat array
// of subcategory + parent category ids from the tagger).
//
// `last_synced_at`, `created_at`, `updated_at` are set by Postgres and
// are not modeled here.
export interface CanonicalBill {
  full_identifier: string
  congress_number: number
  bill_type: BillType
  bill_number: number
  title: string
  short_title: string | null
  summary_text: string | null
  sponsor_bioguide_id: string
  introduced_date: string
  last_action_date: string
  last_action_text: string
  status: BillStatus
  congress_gov_url: string
  issue_tags: string[]
  urgency_score: number
}

// The four bill types the MVP cares about. Resolutions (`hres`, `sres`)
// and concurrent resolutions (`hconres`, `sconres`) are filtered out at
// the list-response level — they don't carry the same legislative
// weight and would inflate the feed without proportional value.
export type BillType = 'hr' | 's' | 'hjres' | 'sjres'

// The closed token set the bills.status column accepts. Anything that
// doesn't match a keyword pattern in mapStatusFromAction falls through
// to 'committee' (the 0.45 default urgency tier) so we never write a
// status the schema doesn't expect.
export type BillStatus =
  | 'floor_vote'
  | 'passed_chamber'
  | 'conference'
  | 'markup'
  | 'committee'
  | 'signed'
  | 'vetoed'
  | 'introduced'

// Sparse list-endpoint shape — we never trust list rows for anything
// other than (congress, type, number) to drive the detail fetch.
export interface CongressBillListItem {
  congress: number
  type: string
  number: string | number
  url: string
}

interface CongressPagination {
  count?: number
  next?: string
}

interface CongressBillListResponse {
  bills?: CongressBillListItem[]
  pagination?: CongressPagination
}

// Detail-endpoint shape — pared down to the fields we actually read.
// Congress.gov returns far more (committees, cosponsors, related bills,
// etc.); we omit them rather than pretending to model the whole API.
//
// Notably absent: a `summary` / `summaries.text` field. The bill detail
// endpoint surfaces only a sub-resource pointer — actual summary text
// lives at /bill/{congress}/{type}/{number}/summaries and requires a
// separate fetch we don't make in this phase. `bills.summary_text` is
// therefore always null on initial sync; Phase 3b/4 owns `ai_summary`.
// If a future phase wants Congress.gov's own summary text, add a
// fetchBillSummary() call here and populate summary_text from it.
export interface CongressBillDetail {
  congress: number
  type: string
  number: string | number
  title: string
  shortTitle?: string
  introducedDate?: string
  updateDate?: string
  sponsors?: Array<{ bioguideId?: string }>
  latestAction?: { actionDate?: string; text?: string }
}

interface CongressBillDetailResponse {
  bill: CongressBillDetail
}

const ACCEPTED_BILL_TYPES: ReadonlySet<BillType> = new Set([
  'hr',
  's',
  'hjres',
  'sjres',
])

// Exported so the cron can prefilter list-endpoint rows before
// spending detail-fetch quota on bill types we'll discard anyway
// (hres, sres, hconres, sconres). Defensive re-check still happens
// inside mapDetailToBill so unfiltered callers can't write bad rows.
export function normalizeBillType(raw: string): BillType | null {
  const lc = raw.toLowerCase()
  return ACCEPTED_BILL_TYPES.has(lc as BillType) ? (lc as BillType) : null
}

// ============================================================
// Bill ingestion — fetchers
// ============================================================

// Paginates /bill?fromDateTime=... in updateDate-desc order. Returns
// every list-endpoint row whose update is newer than fromDateTime.
//
// Congress.gov returns `pagination.next` as an absolute URL when there
// are more pages; we follow it directly rather than reconstructing
// query params, so any sort/filter the server applied is preserved.
//
// `format=json` and our api_key are appended to the next URL because
// Congress.gov echoes `format` and the api_key onto the next link, but
// belt-and-suspenders to ensure we don't get HTML or 401 if the API
// shape shifts.
export async function fetchRecentBills(
  fromDateTime: string,
): Promise<CongressBillListItem[]> {
  // `URL.searchParams.set` URL-encodes `+` to `%2B`, so the combined
  // `sort=updateDate+desc` form Congress.gov documents in some examples
  // can't be passed safely through this API. Use the equivalent
  // `sort=updateDate&direction=desc` two-param form per the spec.
  // Even if `direction` is ignored on this endpoint, descending update
  // order is the API default for the bill list.
  const initial = await congressFetch<CongressBillListResponse>('/bill', {
    fromDateTime,
    sort: 'updateDate',
    direction: 'desc',
  })
  const all: CongressBillListItem[] = [...(initial.bills ?? [])]
  let next = initial.pagination?.next

  while (next) {
    const url = new URL(next)
    url.searchParams.set('format', 'json')
    url.searchParams.set('api_key', process.env.CONGRESS_API_KEY ?? 'DEMO_KEY')
    const page = await fetchWithRetry<CongressBillListResponse>(url.toString())
    all.push(...(page.bills ?? []))
    next = page.pagination?.next
  }

  return all
}

export async function fetchBillDetail(
  congress: number,
  type: string,
  billNumber: number,
): Promise<CongressBillDetail> {
  const data = await congressFetch<CongressBillDetailResponse>(
    `/bill/${congress}/${type.toLowerCase()}/${billNumber}`,
  )
  return data.bill
}

// ============================================================
// SYNC-TIME STATUS DERIVATION
// ============================================================

// Keyword-based mapping from raw Congress.gov action text to the
// canonical BillStatus token set.
//
// IMPORTANT: This function never returns 'introduced'. The
// introduced→committee boundary is time-based and applied at read-time
// via deriveDisplayStatus(). At sync time we record the highest
// action-text-implied state; for brand-new bills that's 'committee'
// (referral happens automatically and almost always within hours of
// introduction).
//
// Order matters — more specific patterns (signed, vetoed) come before
// more generic ones (passed, floor) to avoid accidental capture.
//
// Unmatched action text is logged via console.warn and falls through
// to 'committee'. Production logs surface drift candidates.
export function mapStatusFromAction(actionText: string): BillStatus {
  const text = actionText.toLowerCase().trim()
  if (!text) {
    console.warn('[congress.mapStatusFromAction] empty action text — defaulting to committee')
    return 'committee'
  }

  if (text.includes('became public law') || text.includes('signed by president')) {
    return 'signed'
  }
  if (text.includes('vetoed')) return 'vetoed'
  if (text.includes('conference report') || text.includes('conference committee')) {
    return 'conference'
  }
  if (
    text.includes('passed house') ||
    text.includes('passed senate') ||
    text.includes('passed/agreed to') ||
    text.includes('agreed to in') ||
    text.includes('received in the senate') ||
    text.includes('received in the house') ||
    text.includes('held at the desk')
  ) {
    return 'passed_chamber'
  }
  if (
    text.includes('cloture') ||
    text.includes('motion to proceed') ||
    text.includes('floor consideration') ||
    text.includes('vote scheduled') ||
    text.includes('placed on') ||
    text.includes('legislative calendar') ||
    text.includes('rule providing for') ||
    text.includes('scheduled for') ||
    text.includes('considered by')
  ) {
    return 'floor_vote'
  }
  if (
    text.includes('markup') ||
    text.includes('ordered to be reported') ||
    text.includes('reported by') ||
    text.includes('reported to')
  ) {
    return 'markup'
  }
  // Brand-new bills land here. The "Read twice and referred to..." path
  // is recorded as 'committee' — the 'introduced' display state is
  // derived at read time from introduced_date, not action text.
  if (
    text.includes('introduced in house') ||
    text.includes('introduced in senate') ||
    text.includes('read twice and referred') ||
    text.includes('referred to the')
  ) {
    return 'committee'
  }

  console.warn(
    `[congress.mapStatusFromAction] unmatched action text — falling through to 'committee': "${actionText}"`,
  )
  return 'committee'
}

// ============================================================
// READ-TIME STATUS DERIVATION
// ============================================================

// Number of days a bill displays as 'introduced' before transitioning
// to its stored sync-time status. 7 days per Phase 3a product call.
export const RECENTLY_INTRODUCED_WINDOW_DAYS = 7

// Returns the user-facing display status for a bill. For the first
// RECENTLY_INTRODUCED_WINDOW_DAYS after introduction, returns
// 'introduced' regardless of stored status — unless the bill has
// already advanced past committee, in which case the stored status
// wins (a bill that passes the House on day 3 must not display as
// 'introduced').
//
// Pure function — no DB access, no side effects. Call from feed-query
// post-processing or from the bill detail-page renderer in Phase 3b.
export function deriveDisplayStatus(
  storedStatus: BillStatus,
  introducedDate: string,
  now: Date = new Date(),
): BillStatus {
  // Stored statuses that mean "something past committee has happened" —
  // never override with 'introduced' even if the bill is <7 days old.
  const advancedStatuses: ReadonlySet<BillStatus> = new Set([
    'markup',
    'floor_vote',
    'passed_chamber',
    'conference',
    'signed',
    'vetoed',
  ])
  if (advancedStatuses.has(storedStatus)) return storedStatus

  // storedStatus is 'committee' or (legacy) 'introduced' — apply the
  // time-based override.
  const introduced = new Date(introducedDate)
  if (Number.isNaN(introduced.getTime())) {
    // Defensive: malformed date string. Trust the stored status.
    return storedStatus
  }

  const ageMs = now.getTime() - introduced.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  if (ageDays < RECENTLY_INTRODUCED_WINDOW_DAYS) return 'introduced'
  return 'committee'
}

// Implements the formula in SCHEMA.md exactly. The status weights are
// flagged as uncalibrated in migration 006's TODO — do not "improve"
// them here. Calibration is v1.1 polish.
//
// Range: [0.000, 1.000]. The schema CHECK constraint will reject
// anything outside that band, which we enforce with a final clamp.
export function computeUrgencyScore(
  status: BillStatus,
  lastActionDate: string | null,
): number {
  const baseByStatus: Record<BillStatus, number> = {
    floor_vote: 0.9,
    passed_chamber: 0.75,
    conference: 0.75,
    markup: 0.65,
    committee: 0.45,
    signed: 0.3,
    vetoed: 0.3,
    introduced: 0.2,
  }
  const base = baseByStatus[status] ?? 0.2

  let bonus = 0
  if (lastActionDate) {
    const days = (Date.now() - new Date(lastActionDate).getTime()) / 86_400_000
    if (Number.isFinite(days)) {
      if (days < 3) bonus = 0.1
      else if (days < 7) bonus = 0.05
    }
  }

  const raw = base + bonus
  if (raw < 0) return 0
  if (raw > 1) return 1
  // numeric(4,3) — three decimal places of precision in the schema.
  return Math.round(raw * 1000) / 1000
}

// Maps a Congress.gov detail response to the canonical bill record we
// upsert into `bills`. Returns null (rather than throwing) when the
// detail response is missing any field the schema requires NOT NULL —
// sponsor_bioguide_id, introduced_date, latestAction.text/date,
// or a non-MVP bill_type. The cron uses the null return to count these
// as "skipped" so partial-success accounting stays clean: skipped is
// not the same outcome as a 5xx-from-Congress.gov failure.
export function mapDetailToBill(detail: CongressBillDetail): CanonicalBill | null {
  const billType = normalizeBillType(detail.type ?? '')
  if (!billType) return null

  const billNumber = Number(detail.number)
  if (!Number.isFinite(billNumber) || billNumber <= 0) return null

  const congressNumber = detail.congress
  if (!Number.isFinite(congressNumber) || congressNumber <= 0) return null

  const sponsorBioguide = detail.sponsors?.[0]?.bioguideId
  if (!sponsorBioguide) return null

  const introducedDate = detail.introducedDate
  if (!introducedDate) return null

  const lastActionText = detail.latestAction?.text
  const lastActionDate = detail.latestAction?.actionDate
  if (!lastActionText || !lastActionDate) return null

  const status = mapStatusFromAction(lastActionText)
  // summary_text is intentionally null at sync time — Congress.gov's
  // detail endpoint doesn't surface inline summary text, and the lazy
  // ai_summary path (Phase 3b/4) is what populates the bill detail
  // page. tagBill runs against the title alone for now; once a future
  // phase wires the /summaries sub-fetch, pass it as the second arg.
  const tags = tagBill(detail.title ?? '', '')
  const issueTags = Array.from(
    new Set([...tags.subcategory_ids, ...tags.category_ids]),
  )

  return {
    full_identifier: `${billType}-${billNumber}-${congressNumber}`,
    congress_number: congressNumber,
    bill_type: billType,
    bill_number: billNumber,
    title: detail.title ?? '',
    short_title: detail.shortTitle ?? null,
    summary_text: null,
    sponsor_bioguide_id: sponsorBioguide,
    introduced_date: introducedDate,
    last_action_date: lastActionDate,
    last_action_text: lastActionText,
    status,
    congress_gov_url: buildCongressGovUrl(congressNumber, billType, billNumber),
    issue_tags: issueTags,
    urgency_score: computeUrgencyScore(status, lastActionDate),
  }
}

// Builds the public congress.gov URL deterministically. Congress.gov's
// detail endpoint doesn't carry a stable public-URL field across API
// versions, so constructing it ourselves is more robust than parsing
// for one.
//
// Ordinal note: the URL uses `${N}th-congress` which is correct for
// Congress 119 and 120 (the MVP-era congresses). Congress 121 onward
// requires proper ordinals — `121st-congress`, `122nd-congress`,
// `123rd-congress`, then `th` from 124 on. Revisit before Jan 2029.
function buildCongressGovUrl(
  congress: number,
  type: BillType,
  number: number,
): string {
  return `https://www.congress.gov/bill/${congress}th-congress/${billTypePathSegment(type)}/${number}`
}

// Maps a canonical bill_type token to the URL slug Congress.gov uses
// in its public web URLs (e.g. 'hr' → 'house-bill').
function billTypePathSegment(type: BillType): string {
  switch (type) {
    case 'hr':
      return 'house-bill'
    case 's':
      return 'senate-bill'
    case 'hjres':
      return 'house-joint-resolution'
    case 'sjres':
      return 'senate-joint-resolution'
  }
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
