'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CallFlowProps {
  billId: string
  scriptGenerationId: string | null
}

interface RepRow {
  id: string
  full_name: string
  party: string
  state: string
  district: string | null
  chamber: 'house' | 'senate'
  dc_office_phone: string
}

// Shape of the embedded select below — mirrors loadLinkedReps in
// lib/actions/sync-reps.ts. The to-one FK (user_representatives.
// representative_id → representatives.id) resolves to a single object
// (or null), not an array.
interface LinkedRepRow {
  representatives: RepRow | null
}

function repTitle(chamber: 'house' | 'senate', state: string, district: string | null) {
  if (chamber === 'senate') return `U.S. Senator, ${state}`
  const isAtLarge = !district || district === '0'
  return isAtLarge
    ? `U.S. Representative, ${state} (At Large)`
    : `U.S. Representative, ${state}-${district}`
}

function telHref(phone: string): string {
  // Strip everything that isn't a digit and prepend +1. RFC 3966 allows
  // hyphens but +E.164 form is the most reliably parsed across iOS, Android,
  // and desktop link handlers.
  const digits = phone.replace(/\D/g, '')
  return `tel:+1${digits}`
}

export function CallFlow({ billId, scriptGenerationId }: CallFlowProps) {
  const supabase = createClient()
  const [reps, setReps] = useState<RepRow[] | null>(null)
  const [hasAddress, setHasAddress] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set())
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        setLoadErr('Not signed in')
        return
      }
      const userId = userData.user.id

      // Reps + profile address loaded together: a 0-rep result means
      // different things depending on whether an address is on file (see
      // the empty-state branch below). The FK-hint embed mirrors
      // loadLinkedReps in lib/actions/sync-reps.ts; the to-one relation
      // resolves to a single object, not an array.
      const [repsRes, profileRes] = await Promise.all([
        supabase
          .from('user_representatives')
          .select(
            `representatives:representative_id (
              id, full_name, party, state, district, chamber, dc_office_phone
            )`
          )
          .eq('user_id', userId),
        supabase.from('profiles').select('full_address').eq('user_id', userId).maybeSingle(),
      ])
      if (cancelled) return
      if (repsRes.error) {
        setLoadErr('Could not load your representatives')
        return
      }
      // The browser client (lib/supabase/client.ts) is untyped — it returns
      // `null as any` when env is missing — so `.returns<T>()` can't be used
      // here the way loadLinkedReps does on the typed server client.
      // Assigning the `any` result to a typed local is the equivalent and
      // keeps the rest of this function fully typed without a double-cast.
      const links: LinkedRepRow[] = repsRes.data ?? []
      const rows = links.flatMap((link) => (link.representatives ? [link.representatives] : []))
      setReps(rows)
      setHasAddress(Boolean(profileRes.data?.full_address))
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConfirmCall(rep: RepRow) {
    setSubmittingId(rep.id)
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          representativeId: rep.id,
          scriptGenerationId,
        }),
      })
      if (res.ok) {
        setLoggedIds((prev) => new Set(prev).add(rep.id))
      }
      // Silent on failure for MVP — the user already made the call; an
      // inability to log it client-side isn't a blocker. Server logs the
      // error. A retry surface would be a v1.1 polish.
    } finally {
      setSubmittingId(null)
      setConfirmingId(null)
    }
  }

  async function handleCopy(rep: RepRow) {
    try {
      await navigator.clipboard.writeText(rep.dc_office_phone)
      setCopiedId(rep.id)
      window.setTimeout(() => setCopiedId((c) => (c === rep.id ? null : c)), 1500)
    } catch {
      // Clipboard API requires a secure context; the number is also
      // rendered as text on screen so the user can still select-and-copy.
    }
  }

  if (loadErr) {
    return (
      <div className="bg-card rounded-xl border border-divider p-6">
        <p className="text-small text-oxblood">{loadErr}</p>
      </div>
    )
  }

  if (reps === null) {
    return (
      <div className="bg-card rounded-xl border border-divider p-6">
        <p className="text-small text-ink-70">Loading your representatives…</p>
      </div>
    )
  }

  if (reps.length === 0) {
    // Two distinct 0-rep cases, distinguished by whether an address is
    // on file:
    //   - no address  → skipped onboarding (docs/deferred.md#onboarding-skip-not-gated);
    //                    re-entering an address fixes it → round-trip CTA.
    //   - has address → the lookup genuinely returned no current reps
    //                    (vacancy or post-swear-in lag, see
    //                    docs/deferred.md#feature-2-vacant-seats); re-entering
    //                    the same address won't help, so point at Congress.gov.
    if (hasAddress) {
      return (
        <div className="bg-card rounded-xl border border-divider p-6">
          <h2 className="text-h3 text-ink mb-1">Make the call</h2>
          <p className="text-small text-ink-70 mb-4">
            We have your address, but couldn&apos;t find current federal representatives for it —
            a seat may be vacant or pending an update. You can look up your delegation directly on
            Congress.gov.
          </p>
          <a href="https://www.congress.gov/members" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Look up on Congress.gov</Button>
          </a>
        </div>
      )
    }
    return (
      <div className="bg-card rounded-xl border border-divider p-6">
        <h2 className="text-h3 text-ink mb-1">Make the call</h2>
        <p className="text-small text-ink-70 mb-4">
          We don&apos;t have your federal representatives on file yet. Add your address to look them up.
        </p>
        {/* Return round-trip: /representatives hops back here after a
            successful address sync that finds reps. Param is encoded and
            validated against an allowlist on the other side. */}
        <Link href={`/representatives?return=${encodeURIComponent(`/bills/${billId}`)}`}>
          <Button>Add my address</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-divider p-6">
      <h2 className="text-h3 text-ink mb-1">Make the call</h2>
      <p className="text-small text-ink-70 mb-4">
        Tap a number to dial on mobile, or copy it to call from another device.
      </p>

      <div className="space-y-3">
        {reps.map((rep) => {
          const logged = loggedIds.has(rep.id)
          const confirming = confirmingId === rep.id
          const submitting = submittingId === rep.id
          return (
            <div
              key={rep.id}
              className={cn(
                'rounded-md border p-4 transition-opacity',
                logged ? 'border-divider opacity-60' : 'border-divider-strong'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-small font-semibold text-ink leading-tight">{rep.full_name}</div>
                  <div className="text-small text-ink-70 leading-tight">
                    {repTitle(rep.chamber, rep.state, rep.district)}
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">
                  {rep.party}
                </span>
              </div>

              <div className="text-small font-mono text-ink mb-3">{rep.dc_office_phone}</div>

              {logged ? (
                <p className="text-small text-moss">Call logged.</p>
              ) : confirming ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-small text-ink-70 mr-1">Did you make the call?</p>
                  <Button
                    size="sm"
                    variant="signal"
                    onClick={() => handleConfirmCall(rep)}
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? 'Logging…' : 'Yes, I called'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingId(null)}
                    disabled={submitting}
                  >
                    Skip
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={telHref(rep.dc_office_phone)}
                    onClick={() => setConfirmingId(rep.id)}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-signal text-white text-small font-semibold hover:bg-signal-hover"
                  >
                    Tap to call
                  </a>
                  <Button size="sm" variant="outline" onClick={() => handleCopy(rep)}>
                    {copiedId === rep.id ? 'Copied' : 'Copy number'}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
