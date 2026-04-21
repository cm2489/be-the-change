'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INTEREST_CATEGORIES, type InterestCategory } from '@/lib/interests'
import { Button } from '@/components/ui/button'
import { Input, FieldLabel } from '@/components/ui/input'
import { Chip } from '@/components/ui/chip'

type Step = 'location' | 'categories' | 'subcategories' | 'done'

interface SelectedInterest {
  category: string
  subcategory: string | null
}

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
  ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
  ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
  ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
  ['WI','Wisconsin'],['WY','Wyoming'],['DC','Washington D.C.'],
]

const STEPS: Step[] = ['location', 'categories', 'subcategories']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('location')
  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set())
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCategoryList = INTEREST_CATEGORIES.filter(c => selectedCategories.has(c.id))
  const currentCategory = selectedCategoryList[currentCategoryIndex]

  async function handleLocationNext(e: React.FormEvent) {
    e.preventDefault()
    if (!zipCode.match(/^\d{5}$/) && !stateCode) {
      setError('Please enter a valid ZIP code and select your state.')
      return
    }
    setError(null)
    setStep('categories')
  }

  async function handleSkip() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        onboarding_skipped: true,
        onboarding_completed: false,
      })
    }
    router.push('/dashboard')
  }

  function toggleCategory(catId: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  function handleCategoriesNext() {
    if (selectedCategories.size === 0) {
      setError('Please select at least one topic.')
      return
    }
    setError(null)
    setCurrentCategoryIndex(0)
    setStep('subcategories')
  }

  function toggleSubcategory(subId: string) {
    setSelectedSubcategories(prev => {
      const next = new Set(prev)
      if (next.has(subId)) next.delete(subId)
      else next.add(subId)
      return next
    })
  }

  function handleSubcategoryNext() {
    if (currentCategoryIndex < selectedCategoryList.length - 1) {
      setCurrentCategoryIndex(i => i + 1)
    } else {
      handleSave()
    }
  }

  function handleSubcategorySkipAll() {
    if (currentCategory) {
      const allSubs = currentCategory.subcategories.map(s => s.id)
      setSelectedSubcategories(prev => {
        const next = new Set(prev)
        allSubs.forEach(id => next.add(id))
        return next
      })
    }
    handleSubcategoryNext()
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName || user.user_metadata?.full_name || '',
      zip_code: zipCode,
      state_code: stateCode,
      onboarding_completed: true,
      onboarding_skipped: false,
    })

    if (profileError) {
      setError('Failed to save profile. Please try again.')
      setLoading(false)
      return
    }

    const interests: SelectedInterest[] = []
    selectedCategories.forEach((catId) => {
      const catSubs = INTEREST_CATEGORIES.find(c => c.id === catId)?.subcategories ?? []
      const chosenSubs = catSubs.filter(s => selectedSubcategories.has(s.id))
      if (chosenSubs.length === 0) {
        interests.push({ category: catId, subcategory: null })
      } else {
        chosenSubs.forEach(sub => {
          interests.push({ category: catId, subcategory: sub.id })
        })
      }
    })

    await supabase.from('user_interests').delete().eq('user_id', user.id)

    if (interests.length > 0) {
      const rows = interests.map((interest, i) => ({
        user_id: user.id,
        category: interest.category,
        subcategory: interest.subcategory,
        rank: Math.min(99, i + 1),
      }))

      const { error: interestError } = await supabase.from('user_interests').insert(rows)

      if (interestError) {
        setError('Failed to save interests. Please try again.')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Wordmark + heading */}
        <div className="text-center mb-6">
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400 }} className="text-ink mb-3">
            Be The Change
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, lineHeight: 1.2, fontWeight: 400 }} className="text-ink">
            {step === 'location' && 'Where are you located?'}
            {step === 'categories' && 'What issues matter to you?'}
            {step === 'subcategories' && (currentCategory?.label ?? '')}
          </h1>
          {step === 'categories' && (
            <p className="t-small text-fg-2 mt-1.5">
              Pick as many as you like. You can update these anytime.
            </p>
          )}
          {step === 'subcategories' && currentCategory && (
            <p className="t-small text-fg-2 mt-1.5">
              Which specific areas? ({currentCategoryIndex + 1} of {selectedCategoryList.length})
            </p>
          )}
        </div>

        {/* Skip */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSkip}
            className="t-meta text-fg-3 hover:text-ink transition-colors underline underline-offset-2"
            disabled={loading}
          >
            Skip for now
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background: i === stepIndex
                  ? 'var(--ink)'
                  : i < stepIndex
                  ? 'var(--ink-20)'
                  : 'var(--divider-strong)',
              }}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-oxblood/20 bg-oxblood-10 t-small text-oxblood">
            {error}
          </div>
        )}

        <div className="card">

          {/* STEP 1: Location */}
          {step === 'location' && (
            <form onSubmit={handleLocationNext} className="space-y-4">
              <div className="field">
                <FieldLabel htmlFor="fullName">Your name (optional)</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="field">
                <FieldLabel htmlFor="zip">
                  ZIP code <span className="text-signal">*</span>
                </FieldLabel>
                <Input
                  id="zip"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 10001"
                  required
                />
                <p className="t-meta text-fg-3 mt-1.5">
                  Used to find your specific representatives. Never shared.
                </p>
              </div>

              <div className="field">
                <FieldLabel htmlFor="state">
                  State <span className="text-signal">*</span>
                </FieldLabel>
                <select
                  id="state"
                  value={stateCode}
                  onChange={e => setStateCode(e.target.value)}
                  required
                  className="input"
                >
                  <option value="">Select your state</option>
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full">
                Continue
              </Button>
            </form>
          )}

          {/* STEP 2: Category selection */}
          {step === 'categories' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2.5">
                {INTEREST_CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.has(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className="p-3.5 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--ink)' : 'var(--divider)',
                        background: isSelected ? 'var(--ink)' : 'var(--card)',
                        color: isSelected ? 'var(--paper)' : 'var(--fg-1)',
                      }}
                    >
                      <div className="t-small font-semibold leading-tight">{cat.label}</div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep('location')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleCategoriesNext}
                  disabled={selectedCategories.size === 0}
                >
                  Continue ({selectedCategories.size} selected)
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Subcategory drill-down */}
          {step === 'subcategories' && currentCategory && (
            <div className="space-y-4">
              <p className="t-small text-fg-2">{currentCategory.description}</p>

              <div className="flex flex-wrap gap-2">
                {currentCategory.subcategories.map(sub => (
                  <Chip
                    key={sub.id}
                    selected={selectedSubcategories.has(sub.id)}
                    onClick={() => toggleSubcategory(sub.id)}
                  >
                    {sub.label}
                  </Chip>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleSubcategorySkipAll}
                  className="flex-none"
                >
                  All of the above
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleSubcategoryNext}
                  disabled={loading}
                >
                  {loading
                    ? 'Saving…'
                    : currentCategoryIndex < selectedCategoryList.length - 1
                    ? 'Next topic'
                    : 'Finish setup'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
