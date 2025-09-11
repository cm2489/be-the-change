'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Onboarding() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const totalSteps = 5

  // Form data
  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [state, setState] = useState('')
  
  // Political calibration
  const [engagementLevel, setEngagementLevel] = useState('')
  const [politicalStance, setPoliticalStance] = useState('')
  
  // Interests with ranking
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [topInterests, setTopInterests] = useState<string[]>([])
  
  // Communication preferences
  const [callFrequency, setCallFrequency] = useState('weekly')
  const [preferredTimes, setPreferredTimes] = useState<string[]>([])

  const interests = [
    { id: 'climate', name: 'Climate & Environment', icon: '🌍' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'democracy', name: 'Democracy & Voting Rights', icon: '🗳️' },
    { id: 'economy', name: 'Economy & Jobs', icon: '💼' },
    { id: 'immigration', name: 'Immigration', icon: '🗽' },
    { id: 'justice', name: 'Criminal Justice Reform', icon: '⚖️' },
    { id: 'equality', name: 'Equality & Civil Rights', icon: '🤝' },
    { id: 'guncontrol', name: 'Gun Safety', icon: '🛡️' },
    { id: 'technology', name: 'Technology & Privacy', icon: '🔒' }
  ]

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

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId)
      }
      if (prev.length < 5) {
        return [...prev, interestId]
      }
      return prev
    })
  }

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && (!fullName || !zipCode)) {
      alert('Please fill in all fields')
      return
    }
    if (currentStep === 2 && (!engagementLevel || !politicalStance)) {
      alert('Please answer both questions')
      return
    }
    if (currentStep === 3 && selectedInterests.length < 3) {
      alert('Please select at least 3 interests')
      return
    }
    if (currentStep === 3 && selectedInterests.length >= 3) {
      // Ask user to rank their top 3 interests
      setTopInterests(selectedInterests.slice(0, 3))
    }
    
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          zip_code: zipCode,
          state_code: state,
          political_engagement: engagementLevel,
          political_stance: politicalStance,
          call_frequency: callFrequency,
          preferred_times: preferredTimes,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Save interests with ranking
      const interestRecords = selectedInterests.map((interestId, index) => ({
        user_id: user.id,
        interest_id: interestId,
        rank: topInterests.indexOf(interestId) + 1 || 99
      }))

      const { error: interestsError } = await supabase
        .from('user_interests')
        .upsert(interestRecords)

      if (!interestsError) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome! Let&apos;s get to know you</h2>
              <p className="text-gray-600">We&apos;ll personalize your experience based on your location</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="12345"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State (Optional)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="CA"
                maxLength={2}
              />
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Political Profile</h2>
              <p className="text-gray-600">This helps us tailor your experience (always private)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How would you describe your political engagement?
              </label>
              <div className="space-y-3">
                {['New to advocacy', 'Occasionally engaged', 'Actively involved', 'Political professional'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEngagementLevel(level)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      engagementLevel === level
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What best describes your political stance?
              </label>
              <div className="space-y-3">
                {['Progressive', 'Liberal', 'Moderate', 'Conservative', 'Libertarian', 'Independent', 'Prefer not to say'].map((stance) => (
                  <button
                    key={stance}
                    onClick={() => setPoliticalStance(stance)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      politicalStance === stance
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    {stance}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What issues matter to you?</h2>
              <p className="text-gray-600">Select 3-5 issues you care about most</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {interests.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedInterests.includes(interest.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="text-2xl mb-2">{interest.icon}</div>
                  <div className="text-sm font-medium">{interest.name}</div>
                </button>
              ))}
            </div>
            
            <p className="text-center text-sm text-gray-500">
              Selected: {selectedInterests.length} / 5
            </p>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">How often would you like to take action?</h2>
              <p className="text-gray-600">We&apos;ll remind you about important issues at your preferred frequency</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Call Frequency</label>
              <div className="space-y-3">
                {[
                  { value: 'daily', label: "Daily - I'm ready to make a difference every day" },
                  { value: 'weekly', label: 'Weekly - A few times a week works for me' },
                  { value: 'biweekly', label: 'Bi-weekly - Every couple of weeks' },
                  { value: 'monthly', label: 'Monthly - Once a month is good' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCallFrequency(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      callFrequency === option.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Best times to call (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Morning', 'Lunch', 'Afternoon', 'Evening'].map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      setPreferredTimes(prev =>
                        prev.includes(time)
                          ? prev.filter(t => t !== time)
                          : [...prev, time]
                      )
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      preferredTimes.includes(time)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-8">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
              <p className="text-gray-600">Ready to make your voice heard?</p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Your Profile Summary:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📍 Location: {zipCode}</p>
                <p>🎯 Engagement: {engagementLevel}</p>
                <p>💡 Top Issues: {selectedInterests.slice(0, 3).join(', ')}</p>
                <p>📞 Call Frequency: {callFrequency}</p>
              </div>
            </div>
            
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Setting up your dashboard...' : 'Go to Dashboard →'}
            </button>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back
            </button>
          )}
          {currentStep < totalSteps && (
            <button
              onClick={handleNext}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}