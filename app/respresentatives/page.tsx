'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Representative {
  id?: string
  full_name: string
  title: string
  state_code: string
  party?: string
  photo_url?: string
  office_phone?: string
  email?: string
}

interface UserProfile {
  state_code: string
  zip_code: string
  full_name: string
}

export default function Representatives() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserAndReps()
  }, [])

  const loadUserAndReps = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Get user profile with location
      const { data: profileData } = await supabase
        .from('profiles')
        .select('state_code, zip_code, full_name')
        .eq('id', user.id)
        .single()

      if (!profileData?.zip_code || !profileData?.state_code) {
        setError('Please complete your profile with location to see your representatives')
        setLoading(false)
        return
      }
      setProfile(profileData)

      // Fetch representatives from API
      const response = await fetch(
        `/api/representatives?zip=${profileData.zip_code}&state=${profileData.state_code}`
      )

      if (response.ok) {
        const { representatives: repsData } = await response.json()
        setRepresentatives(repsData)
      } else {
        // Fallback to database
        const { data: dbReps } = await supabase
          .from('representatives')
          .select('*')
          .eq('state_code', profileData.state_code)
          .eq('is_active', true)

        if (dbReps && dbReps.length > 0) {
          setRepresentatives(dbReps)
        } else {
          setError('No representatives found for your location')
        }
      }
    } catch (error) {
      console.error('Error loading representatives:', error)
      setError('Failed to load representatives')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="text-xl mb-2">Finding your representatives...</div>
          <div className="text-gray-600">This may take a moment</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-blue-600">Your Representatives</h1>
            </div>
            <div className="text-sm text-gray-600">
              📍 {profile?.zip_code}, {profile?.state_code}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            These are your elected representatives based on your location. 
            Click "Generate Script" to create a personalized message for any issue.
          </p>
        </div>

        {/* Representatives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {representatives.map((rep, index) => (
            <div key={rep.id || index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Representative Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{rep.full_name}</h3>
                      <p className="text-gray-600">{rep.title}</p>
                    </div>
                    {rep.party && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        rep.party.includes('Dem') 
                          ? 'bg-blue-100 text-blue-800' 
                          : rep.party.includes('Rep')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rep.party}
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    {rep.office_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📞</span>
                        <a href={`tel:${rep.office_phone}`} className="hover:text-blue-600">
                          {rep.office_phone}
                        </a>
                      </div>
                    )}
                    {rep.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>✉️</span>
                        <span className="truncate">{rep.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => window.location.href = `tel:${rep.office_phone || '2022243121'}`}
                    className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    📞 Call
                  </button>
                  <button
                    onClick={() => {
                      // Store selected rep and go to script generator
                      localStorage.setItem('selectedRep', JSON.stringify(rep))
                      alert('Script generator coming next!')
                    }}
                    className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    📝 Script
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {representatives.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No representatives found for your location.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  )
}