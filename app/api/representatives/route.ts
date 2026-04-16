import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getRepresentativesByAddress } from '@/lib/google-civic'

const CACHE_TTL_HOURS = 24

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const address = searchParams.get('address')

  const lookupAddress = address || zip
  if (!lookupAddress) {
    return NextResponse.json(
      { error: 'zip or address query parameter required' },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Check cache for this ZIP
  if (zip) {
    const { data: cached } = await adminClient
      .from('rep_lookup_cache')
      .select('rep_ids, fetched_at')
      .eq('zip_code', zip)
      .single()

    if (cached) {
      const ageHours =
        (Date.now() - new Date(cached.fetched_at).getTime()) / 3_600_000
      if (ageHours < CACHE_TTL_HOURS && cached.rep_ids?.length > 0) {
        const { data: reps } = await adminClient
          .from('representatives')
          .select('*')
          .in('id', cached.rep_ids)
          .order('level')

        return NextResponse.json({ representatives: reps ?? [], source: 'cache' })
      }
    }
  }

  // Fetch live from Google Civic API
  try {
    const freshReps = await getRepresentativesByAddress(lookupAddress)

    if (freshReps.length === 0) {
      return NextResponse.json({
        representatives: [],
        source: 'live',
        note: 'No representatives found for this address.',
      })
    }

    // Upsert into representatives table
    const { data: upserted, error: upsertError } = await adminClient
      .from('representatives')
      .upsert(
        freshReps.map(r => ({
          full_name: r.full_name,
          title: r.title,
          level: r.level,
          party: r.party,
          phone: r.phone,
          email: r.email,
          website_url: r.website_url,
          photo_url: r.photo_url,
          source: r.source,
          external_id: r.external_id,
          zip_codes: zip ? [zip] : [],
          last_synced_at: new Date().toISOString(),
        })),
        { onConflict: 'external_id' }
      )
      .select('id')

    // Update lookup cache
    if (zip && upserted && !upsertError) {
      await adminClient.from('rep_lookup_cache').upsert({
        zip_code: zip,
        rep_ids: upserted.map(r => r.id),
        fetched_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      representatives: freshReps,
      source: 'live',
    })
  } catch (err) {
    console.error('Google Civic API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch representatives. Please try again.' },
      { status: 502 }
    )
  }
}
