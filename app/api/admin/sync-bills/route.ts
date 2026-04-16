import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getRecentBills, mapCongressBill } from '@/lib/congress'
import { tagBill } from '@/lib/bill-tagger'

export const maxDuration = 60

export async function POST() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const results = { federal: 0, errors: 0 }

  try {
    const fromDate = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const bills = await getRecentBills(fromDate)

    await Promise.allSettled(
      bills.slice(0, 50).map(async bill => {
        const normalized = mapCongressBill(bill)
        const tags = tagBill(normalized.title, normalized.summary ?? '')
        const { error } = await admin
          .from('bills')
          .upsert({ ...normalized, tags, synced_at: new Date().toISOString() }, { onConflict: 'external_id' })
        if (error) results.errors++
        else results.federal++
      })
    )
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, results })
}
