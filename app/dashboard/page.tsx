'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
        // Skip database check for now to prevent logout loops
        // TODO: Add profile check later when database is properly set up
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
            Welcome back, {user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">
            Ready to make your voice heard? Let's get started.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Call Your Rep Card */}
          <div 
            onClick={() => router.push('/representatives')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-4">📞</div>
            <h3 className="text-lg font-semibold mb-2">Call Your Rep</h3>
            <p className="text-gray-600 text-sm">
              Connect with your representatives in one click
            </p>
          </div>

          {/* Generate Script Card */}
          <div 
            onClick={() => router.push('/scripts/new')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">Generate Script</h3>
            <p className="text-gray-600 text-sm">
              AI-powered scripts for any issue
            </p>
          </div>

          {/* Find Representatives Card */}
          <div 
            onClick={() => router.push('/representatives')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-4">🗳️</div>
            <h3 className="text-lg font-semibold mb-2">Find Representatives</h3>
            <p className="text-gray-600 text-sm">
              Discover who represents you
            </p>
          </div>
        </div>

        {/* Representatives Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Your Representatives</h3>
          <p className="text-gray-600">
            Complete your profile to see your representatives
          </p>
          <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Complete Profile
          </button>
        </div>
      </main>
    </div>
  )
}