'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BillCard } from '@/components/BillCard'
import { Button } from '@/components/ui/button'
import { TopicFilterRail } from '@/components/feed/TopicFilterRail'
import { UrgencyBandHeader } from '@/components/feed/UrgencyBandHeader'
import { AddInterestsBar } from '@/components/feed/AddInterestsBar'
import { groupByBand } from '@/lib/feed/urgencyBands'
import { cn } from '@/lib/utils'

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
  interestCount: number
  selectedCategories: { id: string; label: string }[]
}

// Client wrapper that owns the feed list so "Load more" can page further windows
// of the SAME RPC the server used for page 1, PLUS the in-feed presentation: a
// topic chip-filter rail, urgency-band grouping, and the personalization prompts.
// The list stays one flat urgency-sorted list (bands are headers over contiguous
// runs, not sections); the chip rail FILTERS it client-side on the loaded set.
export function BillsFeed({
  initialBills,
  mode,
  userId,
  pageSize,
  interestCount,
  selectedCategories,
}: BillsFeedProps) {
  const [bills, setBills] = useState<FeedBill[]>(initialBills)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  // A first page already short of a full window means there's nothing more.
  const [done, setDone] = useState(initialBills.length < pageSize)
  // With one interest there's no "All topics" chip, so seed the filter to that
  // category so its chip reads active (the result is the same list either way).
  const [activeCategory, setActiveCategory] = useState<'all' | string>(
    interestCount === 1 ? (selectedCategories[0]?.id ?? 'all') : 'all',
  )

  function handleFilter(value: 'all' | string) {
    setActiveCategory(value)
    // Reset to the top so the filtered list reads from the start.
    window.scrollTo({ top: 0 })
  }

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

  // Filter on the loaded set (personalized feed already returns only the user's
  // categories), then regroup into urgency bands on each render (cheap).
  const filtered =
    activeCategory === 'all'
      ? bills
      : bills.filter((bill) => (bill.issue_tags ?? []).includes(activeCategory))
  const bands = groupByBand(filtered)

  return (
    <div className={cn(interestCount === 1 && 'pb-16')}>
      {/* 0 interests — inline personalize nudge (reuses the dashboard markup); no rail. */}
      {interestCount === 0 && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-divider bg-paper-dark p-4">
          <div>
            <p className="text-body font-medium text-ink">Personalize your feed</p>
            <p className="mt-0.5 text-small text-ink-70">
              Tell us what issues matter to you. Takes 2 minutes.
            </p>
          </div>
          <Link href="/onboarding">
            <Button size="sm">Set up</Button>
          </Link>
        </div>
      )}

      {/* 1+ interests — the topic chip filter rail. */}
      {interestCount >= 1 && (
        <TopicFilterRail
          categories={selectedCategories}
          value={activeCategory}
          onChange={handleFilter}
        />
      )}

      {/* The flat, urgency-banded list. */}
      <div className={cn(interestCount >= 1 && 'mt-4')}>
        {bands.map(({ band, bills: bandBills }) => (
          <div key={band}>
            <UrgencyBandHeader band={band} count={bandBills.length} />
            <div className="space-y-3">
              {bandBills.map((bill) => (
                <BillCard key={bill.id} bill={bill} variant="v4" />
              ))}
            </div>
          </div>
        ))}

        {bands.length === 0 && (
          <p className="py-12 text-center text-small text-ink-70">
            No bills in this topic yet. Try &ldquo;All topics&rdquo; or load more.
          </p>
        )}
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
          <p className="text-small text-ink-70">
            Couldn’t load more.{' '}
            <button onClick={loadMore} className="underline underline-offset-2 hover:text-ink">
              Try again
            </button>
          </p>
        )}
        {done && <p className="text-meta text-ink-70">You’ve reached the end.</p>}
      </div>

      {/* 1 interest — docked "add more interests" nudge. */}
      {interestCount === 1 && <AddInterestsBar />}
    </div>
  )
}
