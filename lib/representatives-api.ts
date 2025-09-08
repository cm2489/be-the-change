import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Representative {
  full_name: string
  title: string
  party?: string
  office_phone?: string
  email?: string
  website_url?: string
  photo_url?: string
  source: string
}

// Get representatives from multiple sources
export async function findRepresentatives(zipCode: string, state: string) {
  const representatives: Representative[] = []

  // 1. Get Federal Representatives (ProPublica or static data)
  const federalReps = await getFederalReps(state)
  representatives.push(...federalReps)

  // 2. Get State Representatives (OpenStates)
  const stateReps = await getStateReps(zipCode, state)
  representatives.push(...stateReps)

  return representatives
}

// Federal Representatives (ProPublica Congress API)
async function getFederalReps(state: string): Promise<Representative[]> {
  try {
    // Get Senators for the state
    const senatorsResponse = await fetch(
      `https://api.propublica.org/congress/v1/members/senate/${state}/current.json`,
      {
        headers: {
          'X-API-Key': process.env.PROPUBLICA_API_KEY || ''
        }
      }
    )

    if (!senatorsResponse.ok) {
      // Fallback to your database
      return getFederalRepsFromDatabase(state)
    }

    const senatorsData = await senatorsResponse.json()

    // Format the data
    return senatorsData.results.map((member: any) => ({
      full_name: `${member.first_name} ${member.last_name}`,
      title: member.role,
      party: member.party,
      office_phone: member.phone,
      website_url: member.url,
      photo_url: `https://theunitedstates.io/images/congress/450x550/${member.id}.jpg`,
      source: 'propublica'
    }))
  } catch (error) {
    console.error('ProPublica API error:', error)
    return getFederalRepsFromDatabase(state)
  }
}

// State Representatives (OpenStates API)
async function getStateReps(zipCode: string, state: string): Promise<Representative[]> {
  try {
    // First, convert ZIP to lat/lng
    const geoResponse = await fetch(
      `https://api.zippopotam.us/us/${zipCode}`
    )

    if (!geoResponse.ok) {
      return []
    }

    const geoData = await geoResponse.json()
    const lat = geoData.places[0].latitude
    const lng = geoData.places[0].longitude

    // Then use OpenStates API
    const response = await fetch(
      `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}`,
      {
        headers: {
          'X-API-KEY': process.env.OPENSTATES_API_KEY || ''
        }
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    return data.results.map((person: any) => ({
      full_name: person.name,
      title: person.current_role.title,
      party: person.party,
      email: person.email,
      photo_url: person.image,
      source: 'openstates'
    }))
  } catch (error) {
    console.error('OpenStates API error:', error)
    return []
  }
}

// Fallback to database
async function getFederalRepsFromDatabase(state: string): Promise<Representative[]> {
  // Use your Supabase data as fallback
  const { data } = await supabase
    .from('representatives')
    .select('*')
    .eq('state_code', state)
    .in('title', ['Senator', 'Representative'])

  return data || []
}
