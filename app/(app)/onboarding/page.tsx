'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INTEREST_CATEGORIES } from '@/lib/interests'
import { syncRepsForUser } from '@/lib/actions/sync-reps'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xl font-bold text-ink mb-1">Oravan</div>
          <h1 className="text-h2 font-bold text-ink">
            {step === 'location' && 'Where are you located?'}
            {step === 'categories' && 'What issues matter to you?'}
          </h1>
          {step === 'categories' && (
            <p className="text-ink-70 text-small mt-2">
              Pick as many as you like. You can always update these later.
            </p>
          )}
        </div>

        {/* Skip button — always visible */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSkip}
            className="text-small text-ink-50 hover:text-ink-70 underline underline-offset-2"
            disabled={loading}
          >
            Just let me make a call — skip for now
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-small text-red-700">
            {error}
          </div>
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

        <Card padding="md" className="shadow-sm">
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
                  ZIP code <span className="text-red-500">*</span>
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
                <p className="mt-1.5 text-xs text-ink-50">
                  Used to filter bills relevant to your state. Never shared.
                </p>
              </div>

              <div>
                <label className="block text-small font-medium text-ink-85 mb-1.5">
                  Full street address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={fullAddress}
                  onChange={e => setFullAddress(e.target.value)}
                  placeholder="123 Main St, Springfield, IL 62701"
                  required
                />
                <p className="mt-1.5 text-xs text-ink-50">
                  We need your full address to find your House district.
                  ZIP codes alone can span multiple districts.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Looking up your reps…' : 'Continue'}
              </Button>
            </form>
          )}

          {/* STEP 2: Flat category selection */}
          {step === 'categories' && (
            <div className="space-y-5">
              <div className="space-y-2">
                {INTEREST_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left transition-all ${
                      selectedCategories.has(cat.id)
                        ? 'border-ink bg-ink-10 text-ink'
                        : 'border-divider hover:border-divider-strong text-ink-85'
                    }`}
                  >
                    <div className="text-small font-semibold leading-tight">{cat.label}</div>
                    <div className="text-xs text-ink-50 mt-0.5">{cat.subline}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => setStep('location')}
                  className="flex-none"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={selectedCategories.size === 0 || loading}
                >
                  {loading ? 'Saving…' : `Finish setup (${selectedCategories.size} selected)`}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
