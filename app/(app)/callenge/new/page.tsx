'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function NewCallengePage() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalCalls, setGoalCalls] = useState(10)
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: callenge, error: createError } = await supabase
      .from('callenges')
      .insert({
        creator_id: session.user.id,
        title,
        description: description || null,
        goal_calls: goalCalls,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
      })
      .select()
      .single()

    if (createError) {
      setError('Failed to create callenge. Please try again.')
      setLoading(false)
      return
    }

    // Auto-join creator
    await supabase.from('callenge_participants').insert({
      callenge_id: callenge.id,
      user_id: session.user.id,
      calls_completed: 0,
    })

    router.push(`/callenge/${callenge.id}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Callenge 🏆</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Callenge name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Climate Call Week with the Squad"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What are you calling about? Any specific bills or issues?"
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-600 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Goal: how many calls total? <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={50}
              value={goalCalls}
              onChange={e => setGoalCalls(Number(e.target.value))}
              className="flex-1 accent-civic-600"
            />
            <div className="text-2xl font-bold text-civic-600 w-12 text-center">
              {goalCalls}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Each participant works toward this individual goal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-600"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create Callenge'}
        </Button>
      </form>
    </div>
  )
}
