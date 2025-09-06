import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zipCode = searchParams.get('zip')
  const state = searchParams.get('state')

  if (!zipCode || !state) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    // Try multiple APIs with fallbacks
    const representatives = []

    // 1. Try USA.gov (no key needed)
    try {
      const usaGovResponse = await fetch(
        `https://www.usa.gov/api/v1/elected-officials/${zipCode}`
      )
      if (usaGovResponse.ok) {
        const data = await usaGovResponse.json()
        // Process and add to representatives array
      }
    } catch (e) {
      console.log('USA.gov API not available')
    }

    // 2. Fallback to your database
    const { data: dbReps } = await supabase
      .from('representatives')
      .select('*')
      .eq('state_code', state)
      .eq('is_active', true)

    if (dbReps) {
      representatives.push(...dbReps)
    }

    // 3. If still no data, use a static dataset
    if (representatives.length === 0) {
      // Add default federal reps for the state
      representatives.push(
        {
          full_name: 'Contact Senator 1',
          title: 'U.S. Senator',
          state_code: state,
          party: 'Unknown',
          office_phone: '(202) 224-3121', // U.S. Capitol Switchboard
          email: 'senator1@senate.gov'
        },
        {
          full_name: 'Contact Senator 2',
          title: 'U.S. Senator',
          state_code: state,
          party: 'Unknown',
          office_phone: '(202) 224-3121',
          email: 'senator2@senate.gov'
        }
      )
    }

    return NextResponse.json({ representatives })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch representatives' },
      { status: 500 }
    )
  }
}