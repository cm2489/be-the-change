'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocode'
import {
  getHouseMemberByDistrict,
  getSenatorsByState,
  getMemberDetail,
  compareSenatorSeniority,
  type CongressMemberDetail,
} from '@/lib/congress'

// 7 days — matches FEATURES.md refresh cadence.
// See docs/deferred.md#feature-2-refresh-window for the v2 "refresh now" button.
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export interface RepForUi {
  id: string
  full_name: string
  party: string
  state: string
  district: string | null
  chamber: 'house' | 'senate'
  dc_office_phone: string
  website_url: string | null
  photo_url: string | null
  relationship_type: 'house' | 'senate_1' | 'senate_2'
}

export type SyncRepsResult =
  | { ok: true; normalizedAddress: string; reps: RepForUi[] }
  | {
      ok: false
      reason: 'unauthorized' | 'invalid_input' | 'unsupported_region' | 'not_found' | 'api_error'
      message: string
    }

export async function syncRepsForUser(address: string): Promise<SyncRepsResult> {
  const trimmed = address.trim()
  if (trimmed.length < 10) {
    return { ok: false, reason: 'invalid_input', message: 'Please enter a full street address including city, state, and ZIP.' }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, reason: 'unauthorized', message: 'You need to be signed in to look up your representatives.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_address, reps_last_refreshed_at')
    .eq('user_id', user.id)
    .single()

  const addressUnchanged = profile?.full_address === trimmed
  const lastRefresh = profile?.reps_last_refreshed_at
  const withinWindow = lastRefresh && Date.now() - new Date(lastRefresh).getTime() < REFRESH_WINDOW_MS
  if (addressUnchanged && withinWindow) {
    const cached = await loadLinkedReps(user.id)
    if (cached.length > 0) {
      return { ok: true, normalizedAddress: profile!.full_address!, reps: cached }
    }
    // Cache miss (nothing linked yet) — fall through to a fresh sync.
  }

  const geo = await geocodeAddress(trimmed)
  if (!geo.ok) {
    return { ok: false, reason: geo.reason, message: geo.message }
  }

  // Fetch reps + details. Any network error bubbles up as api_error.
  let detailed: Array<{ role: 'house' | 'senate'; detail: CongressMemberDetail; listDistrict: number | null }>
  try {
    const [houseList, senatorList] = await Promise.all([
      getHouseMemberByDistrict(geo.stateCode, geo.district),
      getSenatorsByState(geo.stateCode),
    ])
    const roster: Array<{ role: 'house' | 'senate'; bioguideId: string; listDistrict: number | null }> = []
    if (houseList) roster.push({ role: 'house', bioguideId: houseList.bioguideId, listDistrict: houseList.district ?? null })
    for (const s of senatorList) roster.push({ role: 'senate', bioguideId: s.bioguideId, listDistrict: null })

    detailed = await Promise.all(
      roster.map(async r => ({
        role: r.role,
        listDistrict: r.listDistrict,
        detail: await getMemberDetail(r.bioguideId),
      })),
    )
  } catch (err) {
    console.error('Congress.gov fetch failed:', err)
    return { ok: false, reason: 'api_error', message: 'We had trouble reaching Congress.gov. Please try again in a moment.' }
  }

  // Skip-insert any member without a phone or party. Treated as a vacancy
  // — the UI will render a "seat currently vacant" placeholder for missing
  // slots. See docs/deferred.md#feature-2-vacant-seats.
  const repRows = detailed.flatMap(({ role, detail, listDistrict }) => {
    const phone = detail.addressInformation?.phoneNumber
    const party = detail.partyHistory.at(-1)?.partyAbbreviation
    const expectedChamber = role === 'house' ? 'House of Representatives' : 'Senate'
    const currentTerm = detail.terms.find(t => t.chamber === expectedChamber && t.stateCode === geo.stateCode)
    if (!phone || !party || !currentTerm) return []

    const district = role === 'senate' ? null : String(listDistrict ?? 0)
    const termYears = expectedChamber === 'Senate' ? 6 : 2

    return [{
      bioguide_id: detail.bioguideId,
      full_name: detail.directOrderName,
      first_name: detail.firstName,
      last_name: detail.lastName,
      party,
      state: geo.stateCode,
      district,
      chamber: role,
      dc_office_phone: phone,
      photo_url: detail.depiction?.imageUrl ?? null,
      website_url: detail.officialWebsiteUrl ?? null,
      term_start: `${currentTerm.startYear}-01-03`,
      term_end: `${currentTerm.startYear + termYears}-01-03`,
      last_synced_at: new Date().toISOString(),
    }]
  })

  const admin = createAdminClient()
  const { data: upserted, error: upsertErr } = await admin
    .from('representatives')
    .upsert(repRows, { onConflict: 'bioguide_id' })
    .select('id, bioguide_id, full_name, party, state, district, chamber, dc_office_phone, photo_url, website_url')

  if (upsertErr || !upserted) {
    console.error('Rep upsert failed:', upsertErr)
    return { ok: false, reason: 'api_error', message: 'We had trouble saving your representatives. Please try again.' }
  }

  // Senior senator = sort-index 0 per compareSenatorSeniority (Senate-only
  // startYear, alphabetical lastName tiebreak).
  // See docs/deferred.md#feature-2-senate-seniority-tiebreak.
  const senateOrder = detailed
    .filter(d => d.role === 'senate')
    .map(d => d.detail)
    .sort(compareSenatorSeniority)
  const seniorId = senateOrder[0]?.bioguideId
  const juniorId = senateOrder[1]?.bioguideId

  const links = upserted.flatMap(row => {
    let relationship_type: 'house' | 'senate_1' | 'senate_2' | null = null
    if (row.chamber === 'house') relationship_type = 'house'
    else if (row.bioguide_id === seniorId) relationship_type = 'senate_1'
    else if (row.bioguide_id === juniorId) relationship_type = 'senate_2'
    if (!relationship_type) return []
    return [{ user_id: user.id, representative_id: row.id, relationship_type }]
  })

  // Clean-slate the join table so address changes (state-to-state moves)
  // don't leave orphaned old reps linked. Service role required (see SCHEMA.md).
  const { error: deleteErr } = await admin.from('user_representatives').delete().eq('user_id', user.id)
  if (deleteErr) {
    console.error('user_representatives clear failed:', deleteErr)
    return { ok: false, reason: 'api_error', message: 'We had trouble saving your representatives. Please try again.' }
  }

  if (links.length > 0) {
    const { error: linkErr } = await admin.from('user_representatives').insert(links)
    if (linkErr) {
      console.error('user_representatives insert failed:', linkErr)
      return { ok: false, reason: 'api_error', message: 'We had trouble saving your representatives. Please try again.' }
    }
  }

  // Profile update uses the user client — own row, RLS-allowed.
  // If this fails after reps are saved, the UX is slightly degraded (address
  // not normalized, next call will re-sync from Congress.gov) but not broken.
  const now = new Date().toISOString()
  await supabase
    .from('profiles')
    .update({
      full_address: geo.normalizedAddress,
      district_ocd_id: geo.ocdId,
      reps_last_refreshed_at: now,
      updated_at: now,
    })
    .eq('user_id', user.id)

  const reps: RepForUi[] = links.map(link => {
    const row = upserted.find(r => r.id === link.representative_id)!
    return {
      id: row.id,
      full_name: row.full_name,
      party: row.party,
      state: row.state,
      district: row.district,
      chamber: row.chamber as 'house' | 'senate',
      dc_office_phone: row.dc_office_phone,
      website_url: row.website_url,
      photo_url: row.photo_url,
      relationship_type: link.relationship_type,
    }
  })

  return { ok: true, normalizedAddress: geo.normalizedAddress, reps }
}

// Supabase's typed client infers embedded foreign-key joins as arrays
// because it can't determine cardinality at compile time. At runtime,
// many-to-one embeds come back as a single object. Override with
// .returns<T>() to get the accurate type.
type LinkedRepRow = {
  relationship_type: 'house' | 'senate_1' | 'senate_2'
  representatives: {
    id: string
    full_name: string
    party: string
    state: string
    district: string | null
    chamber: 'house' | 'senate'
    dc_office_phone: string
    website_url: string | null
    photo_url: string | null
  } | null
}

async function loadLinkedReps(userId: string): Promise<RepForUi[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('user_representatives')
    .select(`
      relationship_type,
      representatives:representative_id (
        id, full_name, party, state, district, chamber,
        dc_office_phone, photo_url, website_url
      )
    `)
    .eq('user_id', userId)
    .returns<LinkedRepRow[]>()

  if (!data) return []

  return data.flatMap(link => {
    if (!link.representatives) return []
    return [{ ...link.representatives, relationship_type: link.relationship_type }]
  })
}
