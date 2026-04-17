import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getRecentBills, mapCongressBill, isActionableBill } from '@/lib/congress'
import { tagBill } from '@/lib/bill-tagger'

export const maxDuration = 60

function validateSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = request.headers.get('x-cron-secret')
  const urlSecret = new URL(request.url).searchParams.get('secret')
  const authHeader = request.headers.get('authorization')
  const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return [headerSecret, urlSecret, bearerSecret].some(s => s === cronSecret)
}

export async function GET(request: Request) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}

export async function POST(request: Request) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}

async function runSync() {
  const supabase = createAdminClient()
  const results = { federal: 0, skipped: 0, errors: 0 }

  try {
    const allBills = await getRecentBills()
    const batch = allBills.filter(b => isActionableBill(b.latestAction?.text ?? '')).slice(0, 20)

    // Upsert all bills in parallel for speed
    await Promise.allSettled(
      batch.map(async bill => {
        const normalized = mapCongressBill(bill)
        const tags = tagBill(normalized.title, normalized.summary ?? '')

        const { error } = await supabase
          .from('bills')
          .upsert(
            { ...normalized, tags, synced_at: new Date().toISOString() },
            { onConflict: 'external_id' }
          )

        if (error) results.errors++
        else results.federal++
      })
    )
  } catch (err) {
    console.error('Congress.gov sync error:', err)
    results.errors++
  }

  // State bill sync only runs when LegiScan key is available
  const hasLegiScan = !!process.env.LEGISCAN_API_KEY
  const stateNote = hasLegiScan
    ? 'LegiScan sync not included in this simplified version'
    : 'No LEGISCAN_API_KEY set — state bills skipped'

  return NextResponse.json({
    success: true,
    results,
    note: stateNote,
    timestamp: new Date().toISOString(),
  })
}
