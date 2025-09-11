'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RepresentativesDemo() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [locationError, setLocationError] = useState('')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const router = useRouter()

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

  const handleSearchReps = () => {
    console.log('Searching for representatives with:', manualAddress)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">Be The Change</h1>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Home
            </button>
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
                  (But only if you&apos;re chilling at your actual home address, not at the coffee shop! ☕)
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
                    "Yes! I&apos;m home 🏠 Use my location"
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

        {/* Representatives Grid (Sample) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Federal</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">U.S. Senators</h4>
                <p className="text-gray-600 text-sm">Your senators will appear here</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-600">State</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">State Representatives</h4>
                <p className="text-gray-600 text-sm">Your state reps will appear here</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-600">Local</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">City Council</h4>
                <p className="text-gray-600 text-sm">Your local reps will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}