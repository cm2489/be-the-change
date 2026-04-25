'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
// The "Make your call" rep selector + CallFlow modal previously lived on
// this page. Both depended on routes that no longer exist (/api/representatives
// stub) or aren't built yet (/api/scripts → Feature 4, /api/calls → Feature 5).
// For now we link out to /representatives instead — Features 4 + 5 will
// re-introduce an inline call flow here.
// See docs/deferred.md#callflow-bills-detail.
import { urgencyLabel, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Bill {
  id: string
  bill_number: string
  title: string
  summary: string | null
  ai_summary: string | null
  level: string
  state_code: string | null
  status: string
  vote_date: string | null
  last_action: string | null
  urgency_score: number
  full_text_url: string | null
  tags: string[] | null
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: billData } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single()

      if (billData) setBill(billData)
      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading…
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-slate-500">Bill not found.</p>
        <Button className="mt-4" onClick={() => router.push('/bills')}>
          Back to issues
        </Button>
      </div>
    )
  }

  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Bill header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              urgency.color
            )}
          >
            {urgency.label}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {bill.level === 'federal' ? '🇺🇸 Federal' : `🏛️ ${bill.state_code}`}
          </span>
          <span className="text-xs text-slate-400">{bill.bill_number}</span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-tight mb-4">{bill.title}</h1>

        {displaySummary && (
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{displaySummary}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
          {bill.vote_date && (
            <span>Vote scheduled: <strong className="text-slate-600">{formatDate(bill.vote_date)}</strong></span>
          )}
          {bill.last_action && (
            <span className="line-clamp-1">Last action: {bill.last_action}</span>
          )}
          {bill.full_text_url && (
            <a
              href={bill.full_text_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-civic-600 hover:underline ml-auto flex-shrink-0"
            >
              Full text →
            </a>
          )}
        </div>
      </div>

      {/* Call CTA — points users at /representatives until Features 4 + 5
          rebuild the inline script + call flow. See deferred.md#callflow-bills-detail. */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Make your voice heard</h2>
        <p className="text-sm text-slate-500 mb-4">
          Call your federal representatives about this bill.
        </p>
        <Link href="/representatives">
          <Button size="lg" className="w-full sm:w-auto">
            📞 See my representatives
          </Button>
        </Link>
      </div>

    </div>
  )
}
