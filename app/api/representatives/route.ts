import { NextResponse } from 'next/server'

// Sample state data with real senators (as of 2024-2025)
const STATE_SENATORS: { [key: string]: any[] } = {
  'CA': [
    { name: 'Alex Padilla', party: 'Democrat', phone: '(202) 224-3553' },
    { name: 'Laphonza Butler', party: 'Democrat', phone: '(202) 224-3841' }
  ],
  'TX': [
    { name: 'John Cornyn', party: 'Republican', phone: '(202) 224-2934' },
    { name: 'Ted Cruz', party: 'Republican', phone: '(202) 224-5922' }
  ],
  'NY': [
    { name: 'Chuck Schumer', party: 'Democrat', phone: '(202) 224-6542' },
    { name: 'Kirsten Gillibrand', party: 'Democrat', phone: '(202) 224-4451' }
  ],
  'FL': [
    { name: 'Marco Rubio', party: 'Republican', phone: '(202) 224-3041' },
    { name: 'Rick Scott', party: 'Republican', phone: '(202) 224-5274' }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!address && (!lat || !lng)) {
    return NextResponse.json({ error: 'Missing address or coordinates' }, { status: 400 })
  }

  try {
    const representatives = []
    
    // Extract state from address if possible
    let state = 'CA' // Default to CA for demo
    const stateMatch = address?.match(/\b(CA|TX|NY|FL|PA|IL|OH|GA|NC|MI)\b/i)
    if (stateMatch) {
      state = stateMatch[1].toUpperCase()
    }

    // Add federal representatives
    const senators = STATE_SENATORS[state] || STATE_SENATORS['CA']
    senators.forEach((senator, index) => {
      representatives.push({
        id: `sen-${state}-${index}`,
        name: senator.name,
        title: 'U.S. Senator',
        level: 'federal',
        party: senator.party,
        phone: senator.phone,
        email: `contact@${senator.name.toLowerCase().replace(' ', '')}.senate.gov`,
        image: `https://ui-avatars.com/api/?name=${senator.name}&background=3B82F6&color=fff&size=200`
      })
    })

    // Add a sample U.S. Representative
    representatives.push({
      id: 'rep-1',
      name: 'Your District Representative',
      title: 'U.S. Representative',
      level: 'federal',
      party: 'Call to verify',
      phone: '(202) 224-3121',
      email: 'contact@house.gov',
      image: 'https://ui-avatars.com/api/?name=US+Rep&background=10B981&color=fff&size=200'
    })

    // Add state representatives
    representatives.push(
      {
        id: 'state-sen-1',
        name: 'Your State Senator',
        title: 'State Senator',
        level: 'state',
        party: 'Varies by district',
        phone: `(${state === 'CA' ? '916' : '512'}) 555-0001`,
        email: 'senator@state.gov',
        image: 'https://ui-avatars.com/api/?name=State+Sen&background=10B981&color=fff&size=200'
      },
      {
        id: 'state-rep-1',
        name: 'Your State Representative',
        title: 'State Representative',
        level: 'state',
        party: 'Varies by district',
        phone: `(${state === 'CA' ? '916' : '512'}) 555-0002`,
        email: 'representative@state.gov',
        image: 'https://ui-avatars.com/api/?name=State+Rep&background=10B981&color=fff&size=200'
      }
    )

    // Add local representatives
    representatives.push(
      {
        id: 'mayor-1',
        name: 'Your Mayor',
        title: 'Mayor',
        level: 'local',
        party: 'Non-partisan',
        phone: '(555) 555-0100',
        email: 'mayor@city.gov',
        image: 'https://ui-avatars.com/api/?name=Mayor&background=A855F7&color=fff&size=200'
      },
      {
        id: 'council-1',
        name: 'Your City Council Member',
        title: 'City Council',
        level: 'local',
        party: 'Non-partisan',
        phone: '(555) 555-0101',
        email: 'council@city.gov',
        image: 'https://ui-avatars.com/api/?name=Council&background=A855F7&color=fff&size=200'
      }
    )

    return NextResponse.json({ 
      representatives,
      location: address || `${lat}, ${lng}`,
      message: 'Note: For demo purposes, showing sample representatives. In production, this would connect to a real civic data API.'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch representatives' },
      { status: 500 }
    )
  }
}