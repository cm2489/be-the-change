'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Onboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Form data
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [interests, setInterests] = useState<any[]>([])
  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [state, setState] = useState('')

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    } else {
      setUser(user)
      // Check if already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        router.push('/dashboard')
      }
    }
  }, [supabase, router])

  const loadInterests = useCallback(async () => {
    const { data } = await supabase
      .from('interest_categories')
      .select('*')
      .order('display_order')

    if (data) setInterests(data)
  }, [supabase])

  useEffect(() => {
    checkUser()
    loadInterests()
  }, [checkUser, loadInterests])

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId)
      }
      return [...prev, interestId]
    })
  }

  const handleNext = () => {
    if (currentStep === 1 && selectedInterests.length < 3) {
      alert('Please select at least 3 interests')
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const completeOnboarding = async () => {
    if (!fullName || !zipCode) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          zip_code: zipCode,
          state_code: state,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Save interests
      const interestRecords = selectedInterests.map(interestId => ({
        user_id: user.id,
        interest_id: interestId
      }))

      const { error: interestsError } = await supabase
        .from('user_interests')
        .insert(interestRecords)

      if (interestsError) throw interestsError

      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Step {currentStep} of 3</span>
          <span className="text-sm text-gray-600">{Math.round((currentStep / 3) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Welcome */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Be The Change! 👋
          </h2>
          <p className="text-gray-600 mb-8">
            Let&apos;s personalize your experience. First, what issues matter most to you?
            Select at least 3 topics you care about.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {interests.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedInterests.includes(interest.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{interest.icon}</div>
                <div className="font-semibold text-gray-900">{interest.name}</div>
                <div className="text-sm text-gray-600 mt-1">{interest.description}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <div className="text-sm text-gray-600">
              {selectedInterests.length} selected (minimum 3)
            </div>
            <button
              onClick={handleNext}
              disabled={selectedInterests.length < 3}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Personal Info */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tell us about yourself 📍
          </h2>
          <p className="text-gray-600 mb-8">
            We need this information to find your representatives and tailor scripts to your location.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State (Optional)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
                {/* Add more states as needed */}
              </select>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ready to Go */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            You&apos;re all set!
          </h2>
          <p className="text-gray-600 mb-8">
            You&apos;ve selected {selectedInterests.length} issues you care about.
            We&apos;ll use this to personalize your scripts and find the most relevant actions for you.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Your Profile:</h3>
            <div className="text-left space-y-2 text-gray-600">
              <p>📍 Location: {zipCode} {state && `, ${state}`}</p>
              <p>✅ Interests: {selectedInterests.length} topics selected</p>
              <p>👤 Name: {fullName}</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Start Making Change →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}