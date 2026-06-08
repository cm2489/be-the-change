'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { IssuePicker } from '@/components/IssuePicker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, zip_code')
        .eq('user_id', session.user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setZipCode(profile.zip_code || '')
      }

      const { data: interests } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', session.user.id)

      // Browser supabase client is untyped (see docs/deferred.md
      // #untyped-browser-supabase-client) — cast the rows to read `category`.
      const cats = new Set<string>(
        ((interests ?? []) as { category: string | null }[])
          .map(i => i.category)
          .filter((c): c is string => Boolean(c))
      )
      setSelectedCats(cats)

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleCat(id: string) {
    setSelectedCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: session.user.id,
      full_name: fullName,
      zip_code: zipCode,
    }, { onConflict: 'user_id' })
    if (profileError) {
      setError('Failed to save profile. Please try again.')
      setSaving(false)
      return
    }

    // Rebuild interests (flat categories; subcategory always null post-re-anchor)
    await supabase.from('user_interests').delete().eq('user_id', session.user.id)

    const rows = Array.from(selectedCats).map((category, i) => ({
      user_id: session.user.id,
      category,
      subcategory: null,
      rank: i + 1,
    }))

    if (rows.length > 0) {
      const { error: interestError } = await supabase.from('user_interests').insert(rows)
      if (interestError) {
        setError('Failed to save interests. Please try again.')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-ink-70">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader title="Settings" />

      <div className="space-y-6">
        {/* Profile */}
        <Card padding="md">
          <h2 className="font-serif text-h3 text-ink mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-small font-medium text-ink-85 mb-1.5">Full name</label>
              <Input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-small font-medium text-ink-85 mb-1.5">ZIP code</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </Card>

        {/* Interests */}
        <Card padding="md">
          <h2 className="font-serif text-h3 text-ink mb-1">My Issues</h2>
          <p className="text-small text-ink-70 mb-4">
            Select the topics you want to stay informed about.
          </p>
          <IssuePicker selected={selectedCats} onToggle={toggleCat} />
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            'Saving…'
          ) : saved ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Saved
            </>
          ) : (
            'Save changes'
          )}
        </Button>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Admin: Seed bills */}
        <div className="border-t border-divider pt-4">
          <p className="text-meta uppercase text-ink-70 mb-2">Admin</p>
          <SyncBillsButton />
        </div>

        {/* Sign out */}
        <div className="border-t border-divider pt-4">
          <Button variant="destructive" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

function SyncBillsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  async function handleSync() {
    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch('/api/admin/sync-bills', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
        setResult(`Synced ${data.results?.federal ?? 0} federal bills`)
      } else {
        setStatus('error')
        setResult(data.error ?? 'Sync failed')
      }
    } catch {
      setStatus('error')
      setResult('Network error. Try again.')
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Syncing bills…' : 'Sync bills now'}
      </Button>
      {result && (
        <p className={`text-small mt-1 ${status === 'done' ? 'text-moss' : 'text-oxblood'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
