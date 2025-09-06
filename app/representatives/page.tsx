'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Representatives() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
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
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Find Your Representatives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Enter your address or ZIP code"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Search Representatives
            </button>
          </div>
        </div>

        {/* Representatives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Federal Representatives */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Federal</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">U.S. Senators</h4>
                <p className="text-gray-600 text-sm">Enter your location to find your senators</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">U.S. Representative</h4>
                <p className="text-gray-600 text-sm">Enter your location to find your representative</p>
              </div>
            </div>
          </div>

          {/* State Representatives */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-600">State</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">State Senator</h4>
                <p className="text-gray-600 text-sm">Enter your location to find your state senator</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">State Representative</h4>
                <p className="text-gray-600 text-sm">Enter your location to find your state rep</p>
              </div>
            </div>
          </div>

          {/* Local Representatives */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-600">Local</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">Mayor</h4>
                <p className="text-gray-600 text-sm">Enter your location to find your mayor</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">City Council</h4>
                <p className="text-gray-600 text-sm">Enter your location to find council members</p>
              </div>
            </div>
          </div>
        </div>

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
                We'll show you all your representatives at federal, state, and local levels
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