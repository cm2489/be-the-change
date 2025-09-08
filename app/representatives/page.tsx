'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Representatives() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [locationError, setLocationError] = useState('')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [representatives, setRepresentatives] = useState<any[]>([])
  const [searchingReps, setSearchingReps] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth error:', error)
        router.push('/auth/login')
        return
      }
      
      if (user) {
        setUser(user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleUseCurrentLocation = async () => {
    setFetchingLocation(true)
    setLocationError('')
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setFetchingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setManualAddress(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setUseCurrentLocation(true)
        setShowLocationPrompt(false)
        setFetchingLocation(false)
        
        // Automatically search for representatives
        await searchRepresentatives(null, latitude, longitude)
      },
      (error) => {
        setLocationError('Unable to get your location. Please enter your address manually.')
        setFetchingLocation(false)
      }
    )
  }

  const handleManualAddress = () => {
    setShowLocationPrompt(false)
    setUseCurrentLocation(false)
  }

  const searchRepresentatives = async (address?: string | null, lat?: number, lng?: number) => {
    setSearchingReps(true)
    setRepresentatives([])
    
    try {
      const params = new URLSearchParams()
      if (address || manualAddress) {
        params.append('address', address || manualAddress)
      }
      if (lat && lng) {
        params.append('lat', lat.toString())
        params.append('lng', lng.toString())
      }
      
      const response = await fetch(`/api/representatives?${params}`)
      const data = await response.json()
      
      if (data.representatives) {
        setRepresentatives(data.representatives)
      }
    } catch (error) {
      console.error('Error fetching representatives:', error)
      setLocationError('Failed to fetch representatives. Please try again.')
    } finally {
      setSearchingReps(false)
    }
  }

  const handleSearchReps = () => {
    searchRepresentatives(manualAddress)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">Be The Change</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
              >
                Dashboard
              </button>
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Representatives
          </h2>
          <p className="text-gray-600">
            Connect with the people who represent you at all levels of government.
          </p>
        </div>

        {/* Location Prompt */}
        {showLocationPrompt && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-200">
            <div className="text-center">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Quick question - are you home right now?
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We can use your current location to find your representatives instantly! 
                <span className="block mt-2 text-sm font-semibold text-purple-600">
                  (But only if you&rsquo;re chilling at your actual home address, not at the coffee shop! ☕)
                </span>
              </p>
              
              {locationError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {locationError}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={fetchingLocation}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetchingLocation ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">🌍</span> Getting location...
                    </span>
                  ) : (
                    "Yes! I&rsquo;m home 🏠 Use my location"
                  )}
                </button>
                <button
                  onClick={handleManualAddress}
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Nope, let me type my address 📝
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Address Input */}
        {!showLocationPrompt && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">
              {useCurrentLocation ? '📍 Using your current location' : 'Enter Your Home Address'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder={useCurrentLocation ? "Location detected!" : "Enter your home address or ZIP code"}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={useCurrentLocation}
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSearchReps}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search Representatives
                </button>
                <button 
                  onClick={() => {
                    setShowLocationPrompt(true)
                    setUseCurrentLocation(false)
                    setManualAddress('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Change location method"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {searchingReps && (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">🔍</div>
            <p className="text-gray-600">Finding your representatives...</p>
          </div>
        )}

        {/* Representatives Grid */}
        {!searchingReps && representatives.length > 0 && (
          <div className="space-y-8">
            {/* Federal Representatives */}
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-4">Federal Representatives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {representatives
                  .filter(rep => rep.level === 'federal')
                  .map(rep => (
                    <div key={rep.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <img 
                          src={rep.image || `https://ui-avatars.com/api/?name=${rep.name}&background=3B82F6&color=fff&size=100`}
                          alt={rep.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{rep.name}</h4>
                          <p className="text-sm text-gray-600">{rep.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{rep.party}</p>
                          <div className="mt-3 space-y-1">
                            <a href={`tel:${rep.phone}`} className="text-blue-600 hover:underline text-sm block">
                              📞 {rep.phone}
                            </a>
                            <a href={`mailto:${rep.email}`} className="text-blue-600 hover:underline text-sm block">
                              ✉️ Contact
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* State Representatives */}
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-4">State Representatives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {representatives
                  .filter(rep => rep.level === 'state')
                  .map(rep => (
                    <div key={rep.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <img 
                          src={rep.image || `https://ui-avatars.com/api/?name=${rep.name}&background=10B981&color=fff&size=100`}
                          alt={rep.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{rep.name}</h4>
                          <p className="text-sm text-gray-600">{rep.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{rep.party}</p>
                          <div className="mt-3 space-y-1">
                            <a href={`tel:${rep.phone}`} className="text-green-600 hover:underline text-sm block">
                              📞 {rep.phone}
                            </a>
                            <a href={`mailto:${rep.email}`} className="text-green-600 hover:underline text-sm block">
                              ✉️ Contact
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Local Representatives */}
            <div>
              <h3 className="text-2xl font-bold text-purple-600 mb-4">Local Representatives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {representatives
                  .filter(rep => rep.level === 'local')
                  .map(rep => (
                    <div key={rep.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <img 
                          src={rep.image || `https://ui-avatars.com/api/?name=${rep.name}&background=A855F7&color=fff&size=100`}
                          alt={rep.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{rep.name}</h4>
                          <p className="text-sm text-gray-600">{rep.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{rep.party}</p>
                          <div className="mt-3 space-y-1">
                            <a href={`tel:${rep.phone}`} className="text-purple-600 hover:underline text-sm block">
                              📞 {rep.phone}
                            </a>
                            <a href={`mailto:${rep.email}`} className="text-purple-600 hover:underline text-sm block">
                              ✉️ Contact
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchingReps && representatives.length === 0 && !showLocationPrompt && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Representatives Found</h3>
            <p className="text-gray-600">Enter your address above to find your representatives</p>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-12 bg-gray-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h4 className="text-lg font-semibold mb-2">1. Enter Your Location</h4>
              <p className="text-gray-600">
                Provide your address or ZIP code to identify your electoral districts
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-semibold mb-2">2. Find Representatives</h4>
              <p className="text-gray-600">
                We&apos;ll show you all your representatives at federal, state, and local levels
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📞</div>
              <h4 className="text-lg font-semibold mb-2">3. Make Contact</h4>
              <p className="text-gray-600">
                Get contact information and AI-generated scripts for effective advocacy
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}