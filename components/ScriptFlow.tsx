'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Stance = 'support' | 'oppose' | 'undecided'

const STANCE_OPTIONS: { value: Stance; label: string }[] = [
  { value: 'support', label: 'Support' },
  { value: 'oppose', label: 'Oppose' },
  { value: 'undecided', label: 'Undecided' },
]

interface ScriptFlowProps {
  billId: string
}

export function ScriptFlow({ billId }: ScriptFlowProps) {
  const router = useRouter()
  const [stance, setStance] = useState<Stance | null>(null)
  const [scriptText, setScriptText] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!stance || generating) return
    setGenerating(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, stance }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || 'Could not generate script')
        setScriptText(null)
        return
      }
      setScriptText(body.script_text ?? '')
    } catch {
      setError('Network error — please try again')
      setScriptText(null)
    } finally {
      setGenerating(false)
    }
  }

  function handleSelectStance(s: Stance) {
    if (s === stance) return
    setStance(s)
    // Cache key is (user, bill, stance) — different stance means a
    // different cache row. Drop downstream state so the user picks
    // "Get my script" explicitly for the new stance.
    setScriptText(null)
    setSaved(false)
    setError(null)
  }

  return (
    <div className="bg-card rounded-xl border border-divider p-6">
      <h2 className="text-h3 text-ink mb-1">Call script</h2>
      <p className="text-small text-ink-70 mb-4">
        Generate a script to use when calling your federal representatives.
      </p>

      <div className="mb-4">
        <p className="text-small font-semibold text-ink-70 mb-2">Your stance</p>
        <div className="flex flex-wrap gap-2">
          {STANCE_OPTIONS.map((opt) => {
            const active = stance === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectStance(opt.value)}
                aria-pressed={active}
                // Lock the picker while a fetch is in flight. Otherwise a
                // stance change mid-request lets the previous fetch resolve
                // and overwrite the textarea with the old stance's text,
                // while the picker shows the new one.
                disabled={generating}
                className={cn(
                  'px-4 h-10 rounded-md text-small font-semibold border transition-colors duration-micro disabled:opacity-40 disabled:cursor-not-allowed',
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-divider-strong bg-card text-ink hover:bg-ink-10'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {!scriptText && (
        <Button
          onClick={handleGenerate}
          disabled={!stance || generating}
          size="lg"
          aria-busy={generating}
        >
          {generating ? 'Generating…' : 'Get my script'}
        </Button>
      )}

      {error && (
        <p className="mt-3 text-small text-oxblood" role="alert">
          {error}
        </p>
      )}

      {scriptText !== null && (
        <div className="mt-4 space-y-3">
          <p className="text-small text-ink-70">
            AI-drafted. Review and edit before use.
          </p>
          <textarea
            value={scriptText}
            onChange={(e) => {
              setScriptText(e.target.value)
              if (saved) setSaved(false)
            }}
            rows={10}
            aria-label="Script"
            className="w-full rounded-md border border-divider-strong p-3 text-small leading-relaxed bg-paper text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setSaved(true)}
              disabled={saved || generating}
              variant="outline"
            >
              {saved ? 'Saved' : 'Save & Review'}
            </Button>
            <Button
              onClick={() => router.push('/representatives')}
              disabled={!saved}
              variant="signal"
            >
              Call my representative
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
