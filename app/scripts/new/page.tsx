'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function NewScript() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')
  const [selectedRep, setSelectedRep] = useState<any>(null)

  // Form fields
  const [scriptType, setScriptType] = useState<'phone' | 'email' | 'town_hall'>('phone')
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [personalStory, setPersonalStory] = useState('')
  const [tone, setTone] = useState('professional')

  useEffect(() => {
    checkUser()
    loadSelectedRep()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    } else {
      setUser(user)
    }
  }

  const loadSelectedRep = () => {
    // Check if a rep was selected from the representatives page
    const repData = localStorage.getItem('selectedRep')
    if (repData) {
      setSelectedRep(JSON.parse(repData))
    }
  }

  const generateScript = async () => {
    if (!issueTitle) {
      alert('Please enter an issue title')
      return
    }

    setLoading(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userName: profile?.full_name,
          representativeName: selectedRep?.full_name || 'Representative',
          representativeTitle: selectedRep?.title || 'Representative',
          issueTitle,
          issueDescription,
          scriptType,
          tone,
          personalStory
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedScript(data.script)
      } else {
        alert('Failed to generate script. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error generating script')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript)
    alert('Script copied to clipboard!')
  }

  const saveAndUse = async () => {
    // Mark script as used
    await supabase
      .from('scripts')
      .update({ was_used: true })
      .eq('user_id', user?.id)
      .eq('generated_content', generatedScript)

    alert('Script saved! Good luck with your advocacy!')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/representatives')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-blue-600">Generate Script</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedScript ? (
          // Generation Form
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Create Your Advocacy Script</h2>

            {selectedRep && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Generating script for: <strong>{selectedRep.title} {selectedRep.full_name}</strong>
                </p>
              </div>
            )}

            {/* Script Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Script Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setScriptType('phone')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    scriptType === 'phone'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📞</div>
                  <div className="text-sm font-medium">Phone Call</div>
                </button>
                <button
                  onClick={() => setScriptType('email')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    scriptType === 'email'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">✉️</div>
                  <div className="text-sm font-medium">Email</div>
                </button>
                <button
                  onClick={() => setScriptType('town_hall')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    scriptType === 'town_hall'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🎤</div>
                  <div className="text-sm font-medium">Town Hall</div>
                </button>
              </div>
            </div>

            {/* Issue Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Support for Climate Action Bill"
              />
            </div>

            {/* Issue Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description (Optional)
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Provide more context about the issue..."
              />
            </div>

            {/* Personal Story */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Connection (Optional)
              </label>
              <textarea
                value={personalStory}
                onChange={(e) => setPersonalStory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="How does this issue affect you personally?"
              />
            </div>

            {/* Tone Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional & Respectful</option>
                <option value="urgent">Urgent & Concerned</option>
                <option value="personal">Personal & Heartfelt</option>
                <option value="firm">Firm & Direct</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateScript}
              disabled={loading || !issueTitle}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Generating Script...
                </span>
              ) : (
                'Generate Script'
              )}
            </button>
          </div>
        ) : (
          // Generated Script Display
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Your Generated Script</h2>
              <button
                onClick={() => setGeneratedScript('')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Generate Another
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <pre className="whitespace-pre-wrap font-sans text-gray-800">
                {generatedScript}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={saveAndUse}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                ✅ Save & Mark as Used
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
