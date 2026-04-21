'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, FieldLabel } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

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

    const { data: { session } } = await supabase.auth.getSession()
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

    await supabase.from('callenge_participants').insert({
      callenge_id: callenge.id,
      user_id: session.user.id,
      calls_completed: 0,
    })

    router.push(`/callenge/${callenge.id}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 t-meta text-fg-3 hover:text-ink transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>

      <header className="mb-5">
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1.15, fontWeight: 400 }} className="text-ink">
          New Callenge
        </h1>
        <p className="t-small text-fg-2 mt-1">Commit to calls with your people.</p>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-oxblood/20 bg-oxblood-10 t-small text-oxblood">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="space-y-5 mb-4">
          <div className="field">
            <FieldLabel htmlFor="title">
              Callenge name <span className="text-signal">*</span>
            </FieldLabel>
            <Input
              id="title"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Climate Call Week with the Squad"
            />
          </div>

          <div className="field">
            <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What are you calling about? Any specific bills or issues?"
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <FieldLabel htmlFor="goal">Goal: calls per person</FieldLabel>
            <div className="flex items-center gap-4 mt-2">
              <input
                id="goal"
                type="range"
                min={1}
                max={50}
                value={goalCalls}
                onChange={e => setGoalCalls(Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: '#E65A2B' }}
              />
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }} className="text-ink w-10 text-center flex-shrink-0">
                {goalCalls}
              </div>
            </div>
            <p className="t-meta text-fg-3 mt-1.5">
              Each participant works toward this individual goal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <FieldLabel htmlFor="start">Start date</FieldLabel>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <FieldLabel htmlFor="end">End date</FieldLabel>
              <Input
                id="end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create Callenge'}
        </Button>
      </form>
    </div>
  )
}
