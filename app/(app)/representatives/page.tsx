'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RepCard } from '@/components/RepCard'
import { Button } from '@/components/ui/button'
import { Input, FieldLabel } from '@/components/ui/input'

interface Rep {
  id: string
  full_name: string
  title: string
  level: string
  party: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  photo_url: string | null
}

const LEVEL_LABELS: Record<string, string> = {
  federal: 'Federal',
  state: 'State',
  local: 'Local',
}

export default function RepresentativesPage() {
  const supabase = createClient()
  const [reps, setReps] = useState<Rep[]>([])
  const [zipCode, setZipCode] = useState('')
  const [currentZip, setCurrentZip] = useState('')
  const [stateLabel, setStateLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfileZip() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('zip_code, state_code')
        .eq('id', session.user.id)
        .single()
      if (profile?.zip_code) {
        setZipCode(profile.zip_code)
        if (profile.state_code) setStateLabel(profile.state_code)
        fetchReps(profile.zip_code)
      }
    }
    loadProfileZip()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchReps(zip: string) {
    if (!zip.match(/^\d{5}$/)) { setError('Please enter a valid 5-digit ZIP code.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/representatives?zip=${zip}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setReps(data.representatives ?? [])
      setCurrentZip(zip)
    } catch (err: any) {
      setError(err.message || 'Failed to load representatives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const grouped = {
    federal: reps.filter(r => r.level === 'federal'),
    state: reps.filter(r => r.level === 'state'),
    local: reps.filter(r => r.level === 'local'),
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* Heading */}
      <header className="mb-4">
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1.15, fontWeight: 400 }} className="text-ink">
          Your reps
        </h1>
        {currentZip ? (
          <p className="t-small text-fg-2 mt-1 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            ZIP {currentZip}{stateLabel ? ` · ${stateLabel}` : ''}
          </p>
        ) : (
          <p className="t-small text-fg-2 mt-1">Your federal, state, and local officials.</p>
        )}
      </header>

      {/* ZIP lookup */}
      <form onSubmit={e => { e.preventDefault(); fetchReps(zipCode) }} className="mb-5">
        <div className="field mb-3">
          <FieldLabel htmlFor="zip">ZIP code</FieldLabel>
          <Input
            id="zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zipCode}
            onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 10001"
          />
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Loading…' : 'Find my reps'}
        </Button>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-oxblood/20 bg-oxblood-10 t-small text-oxblood">
          {error}
        </div>
      )}

      {/* Grouped reps */}
      {Object.entries(grouped).map(([level, levelReps]) => {
        if (levelReps.length === 0) return null
        return (
          <div key={level} className="mb-5">
            <div className="t-meta text-fg-3 mb-2.5">{LEVEL_LABELS[level]}</div>
            <div className="space-y-2.5">
              {levelReps.map(rep => <RepCard key={rep.id} rep={rep} />)}
            </div>
          </div>
        )
      })}

      {!loading && reps.length === 0 && currentZip && (
        <div className="card py-10 text-center">
          <div className="t-h3 text-ink mb-1">No representatives found</div>
          <div className="t-small text-fg-2">Try a different ZIP code.</div>
        </div>
      )}
    </div>
  )
}
