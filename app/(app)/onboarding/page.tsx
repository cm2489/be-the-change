'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IssuePicker } from '@/components/IssuePicker'
import { syncRepsForUser } from '@/lib/actions/sync-reps'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { OravanWordmark } from '@/components/brand/OravanWordmark'

type Step = 'location' | 'categories'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('location')
  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  // Both ZIP and full address are required:
  //   - ZIP filters the bill feed (state-level matching, see Feature 3 plan)
  //   - Full address is needed to resolve the user's House district via
  //     Google Civic Divisions → Congress.gov. ZIPs straddle districts and
  //     are not reliable for House lookup.
  const [fullAddress, setFullAddress] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- STEP 1: Location ---
  // We sync reps here (not at final save) so a bad address fails fast — the
  // user can fix it before drilling through interest steps. syncRepsForUser
  // owns the writes to profiles.full_address / district_ocd_id /
  // reps_last_refreshed_at; handleSave below intentionally does not touch
  // those fields.
  async function handleLocationNext(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!zipCode.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    if (fullAddress.trim().length < 10) {
      setError('Please enter your full street address (street, city, state, ZIP).')
      return
    }

    setLoading(true)
    const result = await syncRepsForUser(fullAddress)
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }
    setStep('categories')
  }

  function handleSkip() {
    router.push('/dashboard')
  }

  // --- STEP 2: Category selection (flat — one tap per issue) ---
  function toggleCategory(catId: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  // --- SAVE ---
  async function handleSave() {
    if (selectedCategories.size === 0) {
      setError('Please select at least one topic.')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // full_address / district_ocd_id / reps_last_refreshed_at are written
    // by syncRepsForUser at step 1 — do NOT include them here, or we'd
    // overwrite the geocode-normalized address with the raw user input.
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      full_name: fullName || user.user_metadata?.full_name || '',
      zip_code: zipCode,
      onboarding_completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (profileError) {
      setError('Failed to save profile. Please try again.')
      setLoading(false)
      return
    }

    // Rebuild interests from the flat category selection. subcategory is
    // always null post-re-anchor; rank follows selection order.
    await supabase.from('user_interests').delete().eq('user_id', user.id)

    const rows = Array.from(selectedCategories).map((category, i) => ({
      user_id: user.id,
      category,
      subcategory: null,
      rank: Math.min(99, i + 1),
    }))

    const { error: interestError } = await supabase.from('user_interests').insert(rows)
    if (interestError) {
      setError('Failed to save interests. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <div className={`w-full ${step === 'categories' ? 'max-w-2xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          {/* Hidden on desktop — the app sidebar already shows the wordmark there;
              on mobile (no sidebar) this is the only brand mark, so it stays. */}
          <OravanWordmark className="h-7 text-ink mx-auto mb-3 lg:hidden" />
          <h1 className="font-serif text-h2 text-ink">
            {step === 'location' && 'Where are you located?'}
            {step === 'categories' && 'What issues matter to you?'}
          </h1>
          {step === 'categories' && (
            <p className="text-ink-70 text-small mt-2 max-w-md mx-auto">
              Pick a few that matter to you. We&apos;ll filter your feed to the bills that
              affect them. You can change these anytime.
            </p>
          )}
        </div>

        {/* Skip button — always visible */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSkip}
            className="text-small text-ink-70 hover:text-ink-70 underline underline-offset-2"
            disabled={loading}
          >
            Just let me make a call, skip for now
          </button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Step progress */}
        <div className="flex gap-1.5 mb-6">
          {['location', 'categories'].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step === s
                  ? 'bg-ink'
                  : ['location', 'categories'].indexOf(step) > i
                  ? 'bg-ink-20'
                  : 'bg-divider'
              }`}
            />
          ))}
        </div>

        <Card padding="md">
          {/* STEP 1: Location */}
          {step === 'location' && (
            <form onSubmit={handleLocationNext} className="space-y-5">
              <div>
                <label className="block text-small font-medium text-ink-85 mb-1.5">
                  Your name (optional)
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-ink-85 mb-1.5">
                  ZIP code <span className="text-oxblood">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 10001"
                  required
                />
                <p className="mt-1.5 text-small text-ink-70">
                  Used to filter bills relevant to your state. Never shared.
                </p>
              </div>

              <div>
                <label className="block text-small font-medium text-ink-85 mb-1.5">
                  Full street address <span className="text-oxblood">*</span>
                </label>
                <Input
                  type="text"
                  value={fullAddress}
                  onChange={e => setFullAddress(e.target.value)}
                  placeholder="123 Main St, Springfield, IL 62701"
                  required
                />
                <p className="mt-1.5 text-small text-ink-70">
                  We need your full address to find your House district.
                  ZIP codes alone can span multiple districts.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Looking up your reps…' : 'Continue'}
              </Button>
            </form>
          )}

          {/* STEP 2: Flat category selection — two-column editorial contents list */}
          {step === 'categories' && (
            <div className="space-y-6">
              <IssuePicker selected={selectedCategories} onToggle={toggleCategory} />

              <div className="pt-5 border-t border-divider flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-small text-ink-70">
                  <span className="font-medium text-ink">{selectedCategories.size}</span> selected
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="lg" onClick={() => setStep('location')}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={selectedCategories.size === 0 || loading}
                  >
                    {loading ? 'Saving…' : 'Finish setup'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
