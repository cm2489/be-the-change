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
  const [scriptVisible, setScriptVisible] = useState(true)
  const [limitReached, setLimitReached] = useState(false)

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
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', callLogId, status }),
      })
    }
    setFlowState('done')
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-lg overflow-hidden">

        {/* Header — ink background */}
        <div className="bg-ink text-paper px-6 py-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="t-meta text-paper/60">Calling about</p>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-paper/50 hover:text-paper transition-colors leading-none text-xl mt-0.5"
            >
              ×
            </button>
          </div>
          <h2 className="t-h3 text-paper leading-snug line-clamp-2">{bill.title}</h2>
          <p className="t-mono text-paper/50 mt-1">{bill.bill_number}</p>
        </div>

        {/* Rep row */}
        <div className="px-6 py-4 border-b border-divider flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-paper-dark flex items-center justify-center overflow-hidden flex-shrink-0">
            {rep.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="t-small font-semibold text-ink">{repInitials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-small font-semibold text-ink truncate">{rep.full_name}</div>
            <div className="t-meta text-fg-3 truncate">{rep.title}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {party && <span className={`party-badge ${partyClass}`}>{party}</span>}
            {rep.phone && <span className="t-mono text-fg-2">{rep.phone}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* Loading */}
          {flowState === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-8 t-small text-fg-3">
              <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              Generating your script…
            </div>
          )}

          {/* Daily limit hit */}
          {flowState === 'ready' && limitReached && (
            <div className="py-4 text-center space-y-4">
              <p className="t-h3 text-ink">Daily limit reached</p>
              <p className="t-small text-fg-2">
                You&apos;ve made your 5 calls for today. Come back tomorrow, or upgrade for unlimited calls.
              </p>
              <a href="/upgrade">
                <Button variant="action" size="lg" className="w-full">Upgrade to premium</Button>
              </a>
              <button onClick={onClose} className="btn btn-ghost btn-sm w-full">
                Back to issues
              </button>
            </div>
          )}

          {/* Script ready */}
          {flowState === 'ready' && !limitReached && (
            <div className="space-y-4">
              {/* Script toggle */}
              <div>
                <button
                  onClick={() => setScriptVisible(v => !v)}
                  className="flex items-center justify-between w-full t-small font-semibold text-ink mb-2"
                >
                  <span>Your script</span>
                  <span className="t-meta text-fg-3">{scriptVisible ? 'Hide' : 'Show'}</span>
                </button>
                {scriptVisible && (
                  <div className="bg-paper border border-divider rounded-lg p-4 t-small text-ink leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {script}
                  </div>
                )}
              </div>

              <p className="t-meta text-fg-3 text-center">
                Read naturally — it&apos;s a guide, not a mandate.
              </p>

              {rep.phone ? (
                <a href={`tel:${rep.phone}`} onClick={() => setFlowState('called')}>
                  <Button variant="action" size="lg" className="w-full">
                    Call {repLastName}
                  </Button>
                </a>
              ) : (
                <p className="t-small text-fg-2 text-center py-2">
                  No phone number on file.{' '}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(rep.title + ' ' + rep.full_name + ' contact')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-signal font-semibold hover:underline"
                  >
                    Find contact info →
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Confirm call */}
          {flowState === 'called' && (
            <div className="text-center py-2 space-y-5">
              <div>
                <h3 className="t-h2 text-ink">Did you complete the call?</h3>
                <p className="t-small text-fg-2 mt-1">
                  Every call counts — whether it went through or not.
                </p>
              </div>
              <div className="space-y-2">
                <Button variant="action" size="lg" className="w-full" onClick={() => handleCallComplete('completed')}>
                  Yes, I called
                </Button>
                <Button variant="secondary" size="lg" className="w-full" onClick={() => handleCallComplete('skipped')}>
                  I tried — no answer
                </Button>
                <button
                  onClick={() => handleCallComplete('abandoned')}
                  className="btn btn-ghost btn-sm w-full t-small text-fg-3"
                >
                  I&apos;ll try again later
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {flowState === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div>
                <h3 className="t-h2 text-ink">You made a difference</h3>
                <p className="t-small text-fg-2 mt-1">
                  Representatives track constituent contact volume. Your call is counted.
                </p>
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
                Back to issues
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
