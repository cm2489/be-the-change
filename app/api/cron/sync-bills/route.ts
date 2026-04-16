import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getRecentBills, mapCongressBill } from '@/lib/congress'
import {
  getSessionId,
  getMasterList,
  getBillDetail,
  mapLegiScanStatus,
  computeLegiScanUrgency,
} from '@/lib/legiscan'
import { tagBill } from '@/lib/bill-tagger'

export const maxDuration = 300

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

function validateSecret(request: Request): boolean {
  const headerSecret = request.headers.get('x-cron-secret')
  const urlSecret = new URL(request.url).searchParams.get('secret')
  return (headerSecret ?? urlSecret) === process.env.CRON_SECRET
}

export async function GET(request: Request) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return POST(request)
}

export async function POST(request: Request) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = { federal: 0, state: 0, errors: 0 }

  // ---- FEDERAL: Congress.gov ----
  try {
    const fromDate = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const bills = await getRecentBills(fromDate)

    for (const bill of bills.slice(0, 100)) {
      // Limit to 100 per sync to stay within rate limits
      const normalized = mapCongressBill(bill)
      const tags = tagBill(normalized.title, normalized.summary)

      const { error } = await supabase
        .from('bills')
        .upsert(
          { ...normalized, tags, synced_at: new Date().toISOString() },
          { onConflict: 'external_id' }
        )

      if (!error) results.federal++
      else results.errors++
    }
  } catch (err) {
    console.error('Congress.gov sync error:', err)
    results.errors++
  }

  // ---- STATE: LegiScan ----
  // Process states in batches of 5 to avoid rate limits
  for (let i = 0; i < US_STATES.length; i += 5) {
    const batch = US_STATES.slice(i, i + 5)

    await Promise.allSettled(
      batch.map(async stateCode => {
        try {
          const sessionId = await getSessionId(stateCode)
          const masterList = await getMasterList(sessionId)

          // Filter to only active/recent bills (status 2-4 = in progress)
          const activeBills = Object.values(masterList).filter(
            b => b.bill_id && [2, 3, 4].includes(b.status)
          )

          for (const billSummary of activeBills.slice(0, 20)) {
            // Max 20 active bills per state per sync

            // Check if we already have this bill with same change_hash
            const { data: existing } = await supabase
              .from('bills')
              .select('id, change_hash')
              .eq('source', 'legiscan')
              .eq('external_id', String(billSummary.bill_id))
              .single()

            if (existing?.change_hash === billSummary.change_hash) {
              continue // No changes, skip
            }

            const detail = await getBillDetail(billSummary.bill_id)
            const tags = tagBill(detail.title, detail.description)
            const voteDate = detail.votes?.[0]?.date ?? null

            const row = {
              external_id: String(billSummary.bill_id),
              source: 'legiscan' as const,
              bill_number: billSummary.bill_number,
              title: detail.title,
              summary: detail.description || null,
              full_text_url: detail.texts?.[0]?.url ?? null,
              level: 'state' as const,
              state_code: stateCode,
              status: mapLegiScanStatus(billSummary.status),
              vote_date: voteDate,
              last_action: billSummary.last_action,
              last_action_date: billSummary.last_action_date,
              tags,
              urgency_score: computeLegiScanUrgency(billSummary.status, voteDate ?? undefined),
              change_hash: billSummary.change_hash,
              synced_at: new Date().toISOString(),
            }

            const { error } = await supabase
              .from('bills')
              .upsert(row, { onConflict: 'external_id' })

            if (!error) results.state++
            else results.errors++
          }
        } catch (err) {
          console.error(`LegiScan sync error for ${stateCode}:`, err)
          results.errors++
        }
      })
    )

    // Rate limit buffer between batches
    if (i + 5 < US_STATES.length) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  })
}
