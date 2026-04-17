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
    const bills = await getRecentBills()

    const settled = await Promise.allSettled(
      bills.slice(0, 50).map(async bill => {
        const normalized = mapCongressBill(bill)
        const tags = tagBill(normalized.title, normalized.summary ?? '')
        const { error } = await admin
          .from('bills')
          .upsert({ ...normalized, tags, synced_at: new Date().toISOString() }, { onConflict: 'external_id' })
        if (error) { results.errors++; throw error }
        else results.federal++
      })
    )

    const firstError = settled.find(s => s.status === 'rejected') as PromiseRejectedResult | undefined
    if (firstError && results.federal === 0) {
      return NextResponse.json({ error: String(firstError.reason) }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, results })
}
