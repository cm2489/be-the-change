'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { syncRepsForUser, type RepForUi, type SyncRepsResult } from '@/lib/actions/sync-reps'
import { RepCard } from '@/components/RepCard'
import { Button } from '@/components/ui/button'

// Federal-only by design — FEATURES.md scopes state/local reps out of MVP.
// If state reps are added later, they should NOT be poured into these three
// slots; add a separate section keyed off a different relationship_type set.
type SlotKey = 'house' | 'senate_1' | 'senate_2'
const SLOT_LABEL: Record<SlotKey, string> = {
  house: 'U.S. Representative',
  senate_1: 'Senior U.S. Senator',
  senate_2: 'Junior U.S. Senator',
}

export default function RepresentativesPage() {
  const supabase = createClient()
  const [address, setAddress] = useState('')
  const [storedAddress, setStoredAddress] = useState<string | null>(null)
  const [reps, setReps] = useState<RepForUi[]>([])
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function bootstrap() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setInitialLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_address')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.full_address) {
        setAddress(profile.full_address)
        setStoredAddress(profile.full_address)
        // Note: this is NOT a read-only load. syncRepsForUser short-circuits
        // to cached reps when within the 7-day window, but on a cache miss
        // it will call Congress.gov + the geocoder. Keep that in mind before
        // moving this to a different lifecycle hook.
        const result = await syncRepsForUser(profile.full_address)
        if (result.ok) {
          setReps(result.reps)
          setStoredAddress(result.normalizedAddress)
          // Don't overwrite `address` here — the user may have started typing
          // a new address while the bootstrap call was in flight.
        }
        // Failures are intentionally swallowed on bootstrap. The user didn't
        // ask for a refresh; surfacing an API error on page open is noise.
        // The next explicit submit will surface real errors.
      }
      setInitialLoading(false)
    }
    bootstrap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyResult(result: SyncRepsResult) {
    if (result.ok) {
      setReps(result.reps)
      setStoredAddress(result.normalizedAddress)
      setAddress(result.normalizedAddress)
      setError(null)
    } else {
      // Keep existing reps visible; just surface the error. Clearing on
      // failure would erase a working set the user hasn't chosen to lose.
      setError(result.message)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await syncRepsForUser(address)
      applyResult(result)
    })
  }

  const repBySlot: Record<SlotKey, RepForUi | null> = {
    house: reps.find(r => r.relationship_type === 'house') ?? null,
    senate_1: reps.find(r => r.relationship_type === 'senate_1') ?? null,
    senate_2: reps.find(r => r.relationship_type === 'senate_2') ?? null,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Representatives</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your federal House Representative and two U.S. Senators.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Your full address
        </label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="123 Main St, Springfield, IL 62701"
          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-600 focus:border-transparent"
        />
        <p className="text-xs text-slate-400">
          Full street address — required to find your House district.
        </p>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? 'Looking up…' : storedAddress ? 'Update address' : 'Find my reps'}
        </Button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {initialLoading && (
        <div className="text-center text-slate-400 py-8 text-sm">Loading your reps…</div>
      )}

      {!initialLoading && storedAddress && (
        <>
          <p className="text-xs text-slate-400 mb-4">
            Showing reps for <span className="text-slate-600">{storedAddress}</span>
          </p>
          <div className="space-y-3">
            {(['house', 'senate_1', 'senate_2'] as const).map(slot => {
              const rep = repBySlot[slot]
              if (rep) return <RepCard key={slot} rep={rep} />
              return <VacantSlotCard key={slot} label={SLOT_LABEL[slot]} />
            })}
          </div>
        </>
      )}

      {!initialLoading && !storedAddress && !error && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📬</div>
          <p>Enter your address to find your federal representatives.</p>
        </div>
      )}
    </div>
  )
}

// See docs/deferred.md#feature-2-vacant-seats — Congress.gov can return a
// missing/incomplete profile during a vacancy or post-swear-in lag. The sync
// action skip-inserts the link, so a slot just won't appear; render a neutral
// placeholder rather than implying we lost the rep.
function VacantSlotCard({ label }: { label: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4 text-center">
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      <div className="text-xs text-slate-500 mt-1">
        Seat currently vacant or pending update.{' '}
        <a
          href="https://www.congress.gov/members"
          target="_blank"
          rel="noopener noreferrer"
          className="text-civic-600 underline"
        >
          Check Congress.gov
        </a>
      </div>
    </div>
  )
}
