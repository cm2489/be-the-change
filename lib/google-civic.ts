interface CivicOfficial {
  name: string
  party?: string
  phones?: string[]
  emails?: string[]
  urls?: string[]
  photoUrl?: string
}

interface CivicOffice {
  name: string
  levels: string[]
  roles: string[]
  officialIndices: number[]
  divisionId: string
}

interface CivicResponse {
  officials: CivicOfficial[]
  offices: CivicOffice[]
}

export interface NormalizedRepresentative {
  full_name: string
  title: string
  level: 'federal' | 'state' | 'local'
  party: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  photo_url: string | null
  source: 'google_civic'
  external_id: string
}

function mapLevel(civicLevels: string[]): 'federal' | 'state' | 'local' {
  if (civicLevels.includes('country')) return 'federal'
  if (civicLevels.includes('administrativeArea1')) return 'state'
  return 'local'
}

export async function getRepresentativesByAddress(
  address: string
): Promise<NormalizedRepresentative[]> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY
  if (!apiKey) throw new Error('GOOGLE_CIVIC_API_KEY not set')

  const url = new URL(
    'https://civicinfo.googleapis.com/civicinfo/v2/representatives'
  )
  url.searchParams.set('address', address)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // 24-hour cache at the Next.js layer
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `Google Civic API error ${res.status}: ${err?.error?.message ?? 'Unknown error'}`
    )
  }

  const data: CivicResponse = await res.json()

  if (!data.offices || !data.officials) return []

  return data.offices.flatMap(office =>
    office.officialIndices.map(idx => {
      const official = data.officials[idx]
      return {
        full_name: official.name,
        title: office.name,
        level: mapLevel(office.levels),
        party: official.party ?? null,
        phone: official.phones?.[0] ?? null,
        email: official.emails?.[0] ?? null,
        website_url: official.urls?.[0] ?? null,
        photo_url: official.photoUrl ?? null,
        source: 'google_civic' as const,
        external_id: `${office.divisionId}::${idx}`,
      }
    })
  )
}
