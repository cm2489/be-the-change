'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RepCard } from '@/components/RepCard'
import { Button } from '@/components/ui/button'

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

export default function RepresentativesPage() {
  const supabase = createClient()
  const [reps, setReps] = useState<Rep[]>([])
  const [zipCode, setZipCode] = useState('')
  const [currentZip, setCurrentZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'cache' | 'live' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfileZip() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('zip_code')
        .eq('id', session.user.id)
        .single()

      if (profile?.zip_code) {
        setZipCode(profile.zip_code)
        fetchReps(profile.zip_code)
      }
    }
    loadProfileZip()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchReps(zip: string) {
    if (!zip.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/representatives?zip=${zip}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to load')

      setReps(data.representatives ?? [])
      setSource(data.source)
      setCurrentZip(zip)
    } catch (err: any) {
      setError(err.message || 'Failed to load representatives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchReps(zipCode)
  }

  const repsByLevel = {
    federal: reps.filter(r => r.level === 'federal'),
    state: reps.filter(r => r.level === 'state'),
    local: reps.filter(r => r.level === 'local'),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Representatives</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your federal, state, and local elected officials.
        </p>
      </div>

      {/* ZIP code lookup */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={zipCode}
          onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter ZIP code"
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-600 focus:border-transparent"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Find my reps'}
        </Button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {reps.length > 0 && (
        <>
          <p className="text-xs text-slate-400 mb-4">
            Showing representatives for ZIP {currentZip}
            {source === 'cache' ? ' (cached)' : ' (live data)'}
          </p>

          <div className="space-y-6">
            {Object.entries(repsByLevel).map(([level, levelReps]) => {
              if (levelReps.length === 0) return null
              return (
                <div key={level}>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                    {level === 'federal'
                      ? '🇺🇸 Federal Representatives'
                      : level === 'state'
                      ? '🏛️ State Representatives'
                      : '🏘️ Local Officials'}
                  </h2>
                  <div className="space-y-3">
                    {levelReps.map(rep => (
                      <RepCard key={rep.id} rep={rep} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && reps.length === 0 && currentZip && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>No representatives found for ZIP {currentZip}.</p>
          <p className="text-sm mt-1">Try a different ZIP code.</p>
        </div>
      )}
    </div>
  )
}
