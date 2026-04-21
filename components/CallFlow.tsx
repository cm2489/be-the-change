'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { partyLetter } from '@/lib/utils'

interface CallFlowProps {
  rep: {
    id: string
    full_name: string
    title: string
    phone: string | null
    party: string | null
    photo_url?: string | null
  }
  bill: {
    id: string
    title: string
    bill_number: string
    ai_summary?: string | null
    summary?: string | null
  }
  userId: string
  onClose: () => void
}

type FlowState = 'loading' | 'ready' | 'called' | 'done'

export function CallFlow({ rep, bill, onClose }: CallFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('loading')
  const [script, setScript] = useState<string>('')
  const [callLogId, setCallLogId] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [scriptVisible, setScriptVisible] = useState(true)
  const [newTotal, setNewTotal] = useState<number | null>(null)

  const party = partyLetter(rep.party)
  const partyClass = party === 'D' ? 'is-d' : party === 'R' ? 'is-r' : 'is-i'
  const repInitials = rep.full_name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('')
  const repLastName = rep.full_name.split(' ').pop() ?? rep.full_name

  async function loadScript() {
    const scriptRes = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billId: bill.id,
        representativeId: rep.id,
        representativeName: rep.full_name,
        representativeTitle: rep.title,
        billTitle: bill.title,
        billSummary: bill.ai_summary || bill.summary || '',
        scriptType: 'phone',
      }),
    })
    const scriptData = await scriptRes.json()
    setScript(scriptData.script?.content || '')

    const callRes = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'initiate',
        billId: bill.id,
        representativeId: rep.id,
        scriptId: scriptData.script?.id || null,
        scriptType: 'phone',
      }),
    })
    const callData = await callRes.json()
    if (!callRes.ok && callData.error === 'DAILY_LIMIT_REACHED') {
      setLimitReached(true)
    } else {
      setCallLogId(callData.callLogId || null)
    }
    setFlowState('ready')
  }

  if (flowState === 'loading' && !script) loadScript()

  async function handleCallComplete(status: 'completed' | 'skipped' | 'abandoned') {
    if (callLogId) {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', callLogId, status }),
      })
      const data = await res.json()
      if (data.totalCalls) setNewTotal(data.totalCalls)
    }
    setFlowState('done')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(14,42,71,0.72)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg bg-paper overflow-y-auto" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: '0 -8px 32px rgba(0,0,0,0.2)', maxHeight: '88%' }}>

        {/* Ink header */}
        <div className="bg-ink text-paper px-5 py-[18px]" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="t-meta text-paper/70">Calling about</div>
            <button onClick={onClose} aria-label="Close" className="text-paper/60 hover:text-paper transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, lineHeight: 1.25, fontWeight: 400 }} className="text-paper line-clamp-2">
            {bill.title}
          </h2>
          <div className="t-mono mt-1" style={{ color: 'rgba(247,244,238,0.6)' }}>{bill.bill_number}</div>
        </div>

        {/* Rep row */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-divider">
          <div className="w-10 h-10 rounded-full bg-paper-dark flex items-center justify-center overflow-hidden flex-shrink-0">
            {rep.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16 }} className="text-ink">{repInitials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-small font-semibold text-ink truncate">{rep.full_name}</div>
            <div className="t-meta text-fg-3 truncate">{rep.title}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {party && <span className={`party-badge ${partyClass}`}>{party}</span>}
            {rep.phone && <span className="t-mono text-fg-2 text-[12px]">{rep.phone}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">

          {/* Loading */}
          {flowState === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-10 t-small text-fg-3">
              <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Generating your script…
            </div>
          )}

          {/* Limit reached */}
          {flowState === 'ready' && limitReached && (
            <div className="py-4 text-center space-y-4">
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }} className="text-ink">Daily limit reached</h3>
              <p className="t-small text-fg-2">You've made your 5 calls for today. Come back tomorrow, or upgrade for unlimited.</p>
              <a href="/upgrade"><Button variant="action" size="lg" className="w-full">Upgrade to premium</Button></a>
              <button onClick={onClose} className="btn btn-ghost btn-sm w-full">Back to issues</button>
            </div>
          )}

          {/* Script ready */}
          {flowState === 'ready' && !limitReached && (
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setScriptVisible(v => !v)}
                  className="flex items-center justify-between w-full mb-2"
                >
                  <div className="flex items-center gap-1.5 t-meta font-semibold text-fg-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E65A2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.82 3.889 6.133L6 20l4.148-2.271A9.93 9.93 0 0 0 12 17.23c4.97 0 9-3.185 9-7.115C21 6.185 16.97 3 12 3Z"/>
                    </svg>
                    Your script
                  </div>
                  <span className="t-meta text-fg-3">{scriptVisible ? 'Hide' : 'Show'}</span>
                </button>
                {scriptVisible && (
                  <div className="bg-card border border-divider rounded-xl p-3.5 t-small text-fg-1 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {script}
                  </div>
                )}
              </div>
              <p className="t-meta text-fg-3 text-center">Read naturally. This is a guide, not a mandate.</p>
              {rep.phone ? (
                <a href={`tel:${rep.phone}`} onClick={() => setFlowState('called')}>
                  <Button variant="action" size="xl" className="w-full">Call {repLastName}</Button>
                </a>
              ) : (
                <p className="t-small text-fg-2 text-center py-2">
                  No phone number on file.{' '}
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(rep.title + ' ' + rep.full_name + ' contact')}`} target="_blank" rel="noopener noreferrer" className="text-signal font-semibold hover:underline">
                    Find contact info →
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Confirm call */}
          {flowState === 'called' && (
            <div className="text-center py-2 space-y-5">
              {/* Signal icon circle */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#FBE6DC' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E65A2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.53 2 2 0 0 1 3.6 2.36h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400 }} className="text-ink">Did you complete the call?</h3>
                <p className="t-small text-fg-2 mt-1">Every attempt counts — whether they picked up or not.</p>
              </div>
              <div className="space-y-2">
                <Button variant="primary" size="lg" className="w-full" onClick={() => handleCallComplete('completed')}>
                  Yes, I called
                </Button>
                <Button variant="secondary" size="lg" className="w-full" onClick={() => handleCallComplete('skipped')}>
                  Tried, didn't reach them
                </Button>
                <button onClick={() => handleCallComplete('abandoned')} className="btn btn-ghost btn-sm w-full t-small text-fg-3">
                  I'll try again later
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {flowState === 'done' && (
            <div className="text-center py-2 space-y-5">
              {/* Moss icon circle */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#E1EDE7' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F6B4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400 }} className="text-ink">Your call is logged.</h3>
                <p className="t-small text-fg-2 mt-1 leading-relaxed">
                  That's one more constituent the office has to count.
                </p>
              </div>
              {newTotal && (
                <div className="card flex justify-around py-3">
                  <div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }} className="text-ink">{newTotal}</div>
                    <div className="t-meta text-fg-3">Total</div>
                  </div>
                </div>
              )}
              <Button variant="primary" size="lg" className="w-full" onClick={onClose}>Back to issues</Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
