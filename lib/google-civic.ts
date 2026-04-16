interface WimrResult {
  name: string
  party: string
  state: string
  district: string
  phone: string
  office: string
  link: string
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
  source: string
  external_id: string
}

export async function getRepresentativesByAddress(
  address: string
): Promise<NormalizedRepresentative[]> {
  const zipMatch = address.match(/\b(\d{5})\b/)
  const zip = zipMatch?.[1] ?? address.trim()

  if (!zip.match(/^\d{5}$/)) {
    throw new Error('Valid 5-digit ZIP code required')
  }

  const res = await fetch(
    `https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`,
    { next: { revalidate: 86400 } }
  )

  if (!res.ok) {
    throw new Error(`Representative lookup failed: ${res.status}`)
  }

  const data = await res.json()
  const results: WimrResult[] = data.results ?? []

  return results.map((r, i) => {
    const isSenator = !r.district || r.district === '00'
    return {
      full_name: r.name,
      title: isSenator ? 'U.S. Senator' : `U.S. Representative (District ${r.district})`,
      level: 'federal' as const,
      party: r.party || null,
      phone: r.phone || null,
      email: null,
      website_url: r.link || null,
      photo_url: null,
      source: 'whoismyrepresentative',
      external_id: `wimr-${r.state}-${r.district}-${i}`,
    }
  })
}
