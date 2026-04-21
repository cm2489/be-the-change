'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CallFlow } from '@/components/CallFlow'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { urgencyLabel, formatDate, partyLetter } from '@/lib/utils'

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

function LevelIcon({ level }: { level: string }) {
  if (level === 'federal') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="22" x2="2" y2="22"/><path d="M5 22V11l7-9 7 9v11"/><path d="M9 22v-4h6v4"/>
    </svg>
  )
  if (level === 'state') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

const LEVEL_LABELS: Record<string, string> = {
  federal: 'Federal',
  state: 'State',
  local: 'Local',
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)

      const { data: billData } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single()

      if (billData) setBill(billData)

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
      <div className="max-w-2xl mx-auto px-4 py-10 flex items-center justify-center gap-3 t-small text-fg-3">
        <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin flex-shrink-0" />
        Loading…
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="t-small text-fg-2 mb-4">Bill not found.</p>
        <Button variant="outline" onClick={() => router.push('/bills')}>Back to issues</Button>
      </div>
    )
  }

  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary

  const repsByLevel = {
    federal: reps.filter(r => r.level === 'federal'),
    state: reps.filter(r => r.level === 'state'),
    local: reps.filter(r => r.level === 'local'),
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 t-meta text-fg-3 hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>

      {/* Bill card */}
      <Card>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant={urgency.variant}>{urgency.label}</Badge>
          <Badge variant="outline">{bill.level === 'federal' ? 'Federal' : bill.state_code}</Badge>
          <span className="t-mono text-fg-3">{bill.bill_number}</span>
        </div>

        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, lineHeight: 1.3, fontWeight: 400 }} className="text-ink mb-3">
          {bill.title}
        </h1>

        {displaySummary && (
          <p className="t-small text-fg-2 leading-relaxed mb-4">{displaySummary}</p>
        )}

        <div className="flex items-center gap-4 t-meta text-fg-3 border-t border-divider pt-3">
          {bill.vote_date && (
            <span>Vote: <span className="t-mono text-ink">{formatDate(bill.vote_date)}</span></span>
          )}
          {bill.last_action && (
            <span className="line-clamp-1">{bill.last_action}</span>
          )}
          {bill.full_text_url && (
            <a
              href={bill.full_text_url}
              target="_blank"
              rel="noopener noreferrer"
              className="t-meta font-semibold text-ink hover:text-signal transition-colors ml-auto flex-shrink-0"
            >
              Full text →
            </a>
          )}
        </div>
      </Card>

      {/* Call to action */}
      <Card>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400 }} className="text-ink mb-1">
          Make your call
        </h2>
        <p className="t-small text-fg-2 mb-4">Select a representative to call about this issue.</p>

        {!zipCode && (
          <div className="t-small text-fg-2 bg-paper-dark rounded-xl p-4">
            Update your ZIP code in{' '}
            <a href="/settings" className="font-semibold text-ink hover:text-signal transition-colors">
              settings
            </a>{' '}
            to see your representatives.
          </div>
        )}

        {repsLoading && (
          <div className="flex items-center justify-center gap-3 py-6 t-small text-fg-3">
            <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Loading your representatives…
          </div>
        )}

        {!repsLoading && reps.length > 0 && (
          <div className="space-y-4">
            {Object.entries(repsByLevel).map(([level, levelReps]) => {
              if (levelReps.length === 0) return null
              return (
                <div key={level}>
                  <div className="flex items-center gap-1.5 t-meta font-semibold text-fg-3 mb-2">
                    <LevelIcon level={level} />
                    {LEVEL_LABELS[level]}
                  </div>
                  <div className="space-y-2">
                    {levelReps.map(rep => {
                      const party = partyLetter(rep.party)
                      const partyClass = party === 'D' ? 'is-d' : party === 'R' ? 'is-r' : 'is-i'
                      const initials = rep.full_name.split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0]).join('')
                      return (
                        <button
                          key={rep.id}
                          onClick={() => setSelectedRep(rep)}
                          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-divider hover:border-signal/40 hover:bg-paper transition-all text-left group"
                        >
                          <div className="w-9 h-9 rounded-full bg-paper-dark flex items-center justify-center overflow-hidden flex-shrink-0">
                            {rep.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 14 }} className="text-ink">{initials}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="t-small font-semibold text-ink truncate">{rep.full_name}</div>
                            <div className="t-meta text-fg-3 truncate">{rep.title}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {party && <span className={`party-badge ${partyClass}`}>{party}</span>}
                            {rep.phone && (
                              <span className="t-meta font-semibold text-signal group-hover:opacity-70 transition-opacity">
                                Call →
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

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
