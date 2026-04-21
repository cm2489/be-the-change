'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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

export function CallFlow({ rep, bill, userId, onClose }: CallFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('loading')
  const [script, setScript] = useState<string>('')
  const [callLogId, setCallLogId] = useState<string | null>(null)
  const [scriptId, setScriptId] = useState<string | null>(null)
  const [scriptVisible, setScriptVisible] = useState(true)

  async function loadScript() {
    // Generate script
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
    setScriptId(scriptData.script?.id || null)

    // Initiate call log (checks freemium limit)
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

    if (!callRes.ok) {
      if (callData.error === 'DAILY_LIMIT_REACHED') {
        // Show limit message
        setScript(`You've reached your daily limit of ${callData.limit} calls.\n\nUpgrade to premium for unlimited calls.`)
        setFlowState('ready')
        return
      }
    }

    setCallLogId(callData.callLogId || null)
    setFlowState('ready')
  }

  // Load script when component mounts
  if (flowState === 'loading' && !script) {
    loadScript()
  }

  async function handleCallComplete(status: 'completed' | 'skipped' | 'abandoned') {
    if (callLogId) {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          callLogId,
          status,
        }),
      })
    }
    setFlowState('done')
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-civic-600 text-white px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium opacity-80">Calling about:</span>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <h2 className="text-lg font-bold leading-tight line-clamp-2">{bill.title}</h2>
        </div>

        {/* Rep info */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-semibold overflow-hidden flex-shrink-0">
            {rep.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
            ) : (
              rep.full_name.charAt(0)
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{rep.full_name}</div>
            <div className="text-xs text-slate-500">{rep.title}</div>
          </div>
          {rep.phone && (
            <div className="ml-auto text-sm text-slate-500 font-mono">{rep.phone}</div>
          )}
        </div>

        {/* Script area */}
        <div className="px-6 py-4">
          {flowState === 'loading' && (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <div className="animate-spin mr-3 h-5 w-5 border-2 border-civic-600 border-t-transparent rounded-full" />
              Generating your script…
            </div>
          )}

          {flowState === 'ready' && (
            <>
              <button
                onClick={() => setScriptVisible(v => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3"
              >
                <span>📝 Your script</span>
                <span className="text-slate-400">{scriptVisible ? '▲ Hide' : '▼ Show'}</span>
              </button>

              {scriptVisible && (
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto mb-4 border border-slate-200">
                  {script}
                </div>
              )}

              <p className="text-xs text-slate-400 mb-4 text-center">
                Read the script naturally — it&apos;s a guide, not a mandate. Be yourself.
              </p>

              {rep.phone ? (
                <a href={`tel:${rep.phone}`} onClick={() => setFlowState('called')}>
                  <Button variant="signal" size="lg" className="w-full text-lg">
                    📞 Call {rep.full_name.split(' ').pop()}
                  </Button>
                </a>
              ) : (
                <div className="text-center text-slate-500 text-sm py-2">
                  No phone number available.{' '}
                  {rep.title && (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(rep.title + ' ' + rep.full_name + ' contact')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-civic-600 underline"
                    >
                      Find contact info →
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {flowState === 'called' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Did you complete the call?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Your call counts toward today&apos;s impact — whether it went through or not.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handleCallComplete('completed')}
                >
                  ✅ Yes, I called!
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => handleCallComplete('skipped')}
                >
                  I tried but didn&apos;t reach them
                </Button>
                <button
                  onClick={() => handleCallComplete('abandoned')}
                  className="text-sm text-slate-400 hover:text-slate-600 py-2"
                >
                  I&apos;ll try again later
                </button>
              </div>
            </div>
          )}

          {flowState === 'done' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">You made a difference!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Every call matters. Representatives track constituent contact volume — your call
                is counted.
              </p>
              <Button size="lg" className="w-full" onClick={onClose}>
                Back to issues
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
