// Geocoding via the Google Civic Information API — Divisions endpoint.
// The Representatives endpoint was shut down 2025-04-30 and must not be
// used. The Divisions endpoint is still supported and returns OCD-IDs
// that we parse for state + congressional district.

// Regions that resolve to a valid OCD-ID but have no voting federal
// representation: DC has a non-voting House delegate and no senators;
// PR/GU/VI/AS/MP are similar. MVP scope is the 50 voting states only.
const NO_FEDERAL_REPS_REGIONS = new Set(['DC', 'PR', 'GU', 'VI', 'AS', 'MP'])

// Matches OCD-IDs like:
//   ocd-division/country:us/state:ny/cd:14
//   ocd-division/country:us/state:wy/cd:at-large
// Deliberately does NOT match `district:dc` or other territory forms —
// those are filtered earlier via NO_FEDERAL_REPS_REGIONS.
const CD_OCDID_RE = /^ocd-division\/country:us\/state:([a-z]{2})\/cd:([^/]+)$/

export type GeocodeSuccess = {
  ok: true
  stateCode: string
  // Raw district value from the OCD-ID. Numeric districts come back as
  // strings ("14"). At-large states come back as "at-large" — the caller
  // is responsible for mapping to whatever shape Congress.gov expects.
  district: string
  ocdId: string
  normalizedAddress: string
}

export type GeocodeFailure = {
  ok: false
  reason: 'unsupported_region' | 'not_found' | 'api_error'
  // User-safe message. The UI may display this directly.
  message: string
}

export type GeocodeResult = GeocodeSuccess | GeocodeFailure

interface DivisionsResponse {
  normalizedInput?: {
    line1?: string
    city?: string
    state?: string
    zip?: string
  }
  divisions?: Record<string, { name: string; alsoKnownAs?: string[] }>
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      reason: 'api_error',
      message: 'Address lookup is not configured. Please try again later.',
    }
  }

  // GOOGLE_CIVIC_API_BASE_URL is overridable for tests (Playwright points it
  // at a local mock server). Production leaves it unset and we hit Google.
  const base = process.env.GOOGLE_CIVIC_API_BASE_URL ?? 'https://www.googleapis.com/civicinfo/v2'
  const url = new URL(`${base}/divisionsByAddress`)
  url.searchParams.set('address', address)
  url.searchParams.set('key', apiKey)

  let res: Response
  try {
    res = await fetch(url.toString(), { cache: 'no-store' })
  } catch {
    return {
      ok: false,
      reason: 'api_error',
      message: 'We could not reach the address lookup service. Please try again.',
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: 'api_error',
      message: 'The address lookup service returned an error. Please try again.',
    }
  }

  const data = (await res.json()) as DivisionsResponse

  const stateCode = data.normalizedInput?.state?.toUpperCase()
  const line1 = data.normalizedInput?.line1
  const city = data.normalizedInput?.city
  const zip = data.normalizedInput?.zip

  if (!stateCode || !line1 || !city || !zip) {
    return {
      ok: false,
      reason: 'not_found',
      message:
        'We could not find a full address for that input. Please include a street address, city, state, and ZIP.',
    }
  }

  if (NO_FEDERAL_REPS_REGIONS.has(stateCode)) {
    return {
      ok: false,
      reason: 'unsupported_region',
      message: 'Federal representative lookup is only available for the 50 states.',
    }
  }

  const divisions = data.divisions ?? {}
  let matchedOcdId: string | null = null
  let matchedState: string | null = null
  let matchedDistrict: string | null = null
  for (const ocdId of Object.keys(divisions)) {
    const m = CD_OCDID_RE.exec(ocdId)
    if (m) {
      matchedOcdId = ocdId
      matchedState = m[1].toUpperCase()
      matchedDistrict = m[2]
      break
    }
  }

  if (!matchedOcdId || !matchedState || !matchedDistrict) {
    return {
      ok: false,
      reason: 'not_found',
      message:
        'We could not find a congressional district for that address. Double-check the street address.',
    }
  }

  // Silent wrong-state reps are the worst failure mode for this app, so
  // reject rather than guess when the two sources of state disagree.
  if (matchedState !== stateCode) {
    return {
      ok: false,
      reason: 'not_found',
      message: 'That address returned inconsistent location data. Please double-check and try again.',
    }
  }

  return {
    ok: true,
    stateCode,
    district: matchedDistrict,
    ocdId: matchedOcdId,
    normalizedAddress: `${line1}, ${city}, ${stateCode} ${zip}`,
  }
}
