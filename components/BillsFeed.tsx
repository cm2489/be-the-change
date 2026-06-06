'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BillCard } from '@/components/BillCard'

// Shape returned by get_default_feed / get_personalized_feed: the subset
// BillCard reads, plus the row id. ai_headline is returned by both RPCs as of
// migration 20260606200352_feed_add_ai_headline (the V4 card leads with it).
// The personalized feed also returns matched_tags (the bill's issue_tags ∩ the
// user's categories) — present only on the personalized feed, so it's optional.
export interface FeedBill {
  id: string
  full_identifier: string // bills.full_identifier is NOT NULL (the onConflict key)
  title: string
  ai_summary: string | null
  ai_headline: string | null
  summary_text: string | null
  status: string
  introduced_date: string
  urgency_score: number
  issue_tags: string[] | null
  matched_tags?: string[] | null
}

interface BillsFeedProps {
  initialBills: FeedBill[]
  mode: 'default' | 'personalized'
  userId: string
  pageSize: number
}

// Client wrapper that owns the feed list so "Load more" can page further
// windows of the SAME RPC the server used for page 1. Offset = bills.length,
// so each fetch starts exactly where the last ended. The corpus is static
// between manual syncs (sync cron disabled), so offset paging can't skip/dup.
export function BillsFeed({ initialBills, mode, userId, pageSize }: BillsFeedProps) {
  const [bills, setBills] = useState<FeedBill[]>(initialBills)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  // A first page already short of a full window means there's nothing more.
  const [done, setDone] = useState(initialBills.length < pageSize)

  // One page fetch at the current offset. Returns null on any failure (rpc
  // error or thrown) so loadMore can retry without throwing.
  async function fetchPage(): Promise<FeedBill[] | null> {
    try {
      const supabase = createClient()
      const { data, error: rpcError } =
        mode === 'personalized'
          ? await supabase.rpc('get_personalized_feed', {
              p_user_id: userId,
              p_offset: bills.length,
              p_limit: pageSize,
            })
          : await supabase.rpc('get_default_feed', {
              p_offset: bills.length,
              p_limit: pageSize,
            })
      if (rpcError) return null
      return (data ?? []) as FeedBill[]
    } catch {
      return null
    }
  }

  async function loadMore() {
    setLoading(true)
    setError(false)
    // One automatic retry before surfacing the manual try-again state.
    let next = await fetchPage()
    if (next === null) next = await fetchPage()
    if (next === null) {
      setError(true)
      setLoading(false)
      return
    }
    const page = next
    setBills((prev) => [...prev, ...page])
    // Fewer than a full window back ⇒ that was the last page.
    if (page.length < pageSize) setDone(true)
    setLoading(false)
  }

  return (
    <div>
      <div className="space-y-3">
        {bills.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        {!done && !error && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-5 py-2 rounded-pill border border-divider text-small font-medium text-ink hover:border-divider-strong hover:bg-card transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
        {error && (
          <p className="text-small text-ink-50">
            Couldn’t load more —{' '}
            <button
              onClick={loadMore}
              className="underline underline-offset-2 hover:text-ink"
            >
              try again
            </button>
            .
          </p>
        )}
        {done && <p className="text-meta text-ink-50">You’ve reached the end.</p>}
      </div>
    </div>
  )
}
