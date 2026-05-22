'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ScriptFlow } from '@/components/ScriptFlow'
import { CallFlow } from '@/components/CallFlow'
import { urgencyLabel, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Bill {
  id: string
  bill_number: number
  title: string
  summary_text: string | null
  ai_summary: string | null
  status: string
  last_action_text: string | null
  last_action_date: string | null
  urgency_score: number
  congress_gov_url: string | null
  issue_tags: string[] | null
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  // Lifted from ScriptFlow so CallFlow can gate on a saved script and
  // thread the script_generations id into call_events.
  const [scriptSaved, setScriptSaved] = useState(false)
  const [scriptGenerationId, setScriptGenerationId] = useState<string | null>(null)

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
  const displaySummary = bill.ai_summary || bill.summary_text

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
          {/* Federal-only per MVP scope (FEATURES.md); v2 reintroduces a level/state-code branch. */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            🇺🇸 Federal
          </span>
          <span className="text-xs text-slate-400">{bill.bill_number}</span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-tight mb-4">{bill.title}</h1>

        {displaySummary && (
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{displaySummary}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
          {bill.last_action_text && (
            <span className="line-clamp-1">
              Last action: {bill.last_action_text}
              {bill.last_action_date && (
                <span className="text-slate-500"> ({formatDate(bill.last_action_date)})</span>
              )}
            </span>
          )}
          {bill.congress_gov_url && (
            <a
              href={bill.congress_gov_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-civic-600 hover:underline ml-auto flex-shrink-0"
            >
              Full text →
            </a>
          )}
        </div>
      </div>

      {/* Script generation (Feature 4) → call surface (Feature 5). CallFlow
          appears once a script is saved; scriptGenerationId is null only if
          the script's cache insert failed, which CallFlow tolerates. */}
      <div className="space-y-4">
        <ScriptFlow
          billId={bill.id}
          onSavedChange={(saved, id) => {
            setScriptSaved(saved)
            setScriptGenerationId(id)
          }}
        />
        {scriptSaved && (
          <CallFlow billId={bill.id} scriptGenerationId={scriptGenerationId} />
        )}
      </div>

    </div>
  )
}
