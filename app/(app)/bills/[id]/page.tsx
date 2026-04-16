'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CallFlow } from '@/components/CallFlow'
import { Button } from '@/components/ui/button'
import { urgencyLabel, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Rep {
  id: string
  full_name: string
  title: string
  level: string
  phone: string | null
  party: string | null
  photo_url?: string | null
}

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
  const [reps, setReps] = useState<Rep[]>([])
  const [selectedRep, setSelectedRep] = useState<Rep | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [zipCode, setZipCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [repsLoading, setRepsLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)

      // Load bill
      const { data: billData } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single()

      if (billData) setBill(billData)

      // Load user's ZIP code
      const { data: profile } = await supabase
        .from('profiles')
        .select('zip_code')
        .eq('id', session.user.id)
        .single()

      if (profile?.zip_code) {
        setZipCode(profile.zip_code)
        loadReps(profile.zip_code)
      }

      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadReps(zip: string) {
    setRepsLoading(true)
    try {
      const res = await fetch(`/api/representatives?zip=${zip}`)
      const data = await res.json()
      setReps(data.representatives ?? [])
    } catch {
      // silent fail
    } finally {
      setRepsLoading(false)
    }
  }

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

  // Group reps by level
  const repsByLevel = {
    federal: reps.filter(r => r.level === 'federal'),
    state: reps.filter(r => r.level === 'state'),
    local: reps.filter(r => r.level === 'local'),
  }

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

      {/* Representatives — call to action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Make your call</h2>
        <p className="text-sm text-slate-500 mb-4">
          Select a representative to call about this issue.
        </p>

        {!zipCode && (
          <div className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
            Update your ZIP code in{' '}
            <a href="/settings" className="text-civic-600 underline">
              settings
            </a>{' '}
            to see your representatives.
          </div>
        )}

        {repsLoading && (
          <div className="text-sm text-slate-400 py-4 text-center">Loading your representatives…</div>
        )}

        {!repsLoading && reps.length > 0 && (
          <div className="space-y-4">
            {Object.entries(repsByLevel).map(([level, levelReps]) => {
              if (levelReps.length === 0) return null
              return (
                <div key={level}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    {level === 'federal' ? '🇺🇸 Federal' : level === 'state' ? '🏛️ State' : '🏘️ Local'}
                  </div>
                  <div className="space-y-2">
                    {levelReps.map(rep => (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedRep(rep)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-action-400 hover:bg-action-50 transition-all text-left group"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-sm flex-shrink-0 overflow-hidden">
                          {rep.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
                          ) : (
                            rep.full_name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{rep.full_name}</div>
                          <div className="text-xs text-slate-500 truncate">{rep.title}</div>
                        </div>
                        {rep.phone && (
                          <div className="text-xs font-medium text-action-500 group-hover:text-action-600">
                            📞 Call
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CallFlow overlay */}
      {selectedRep && userId && (
        <CallFlow
          rep={selectedRep}
          bill={bill}
          userId={userId}
          onClose={() => setSelectedRep(null)}
        />
      )}
    </div>
  )
}
