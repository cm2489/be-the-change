'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INTEREST_CATEGORIES } from '@/lib/interests'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').upsert({
      user_id: session.user.id,
      full_name: fullName,
      zip_code: zipCode,
    }, { onConflict: 'user_id' })

    // Rebuild interests (flat categories; subcategory always null post-re-anchor)
    await supabase.from('user_interests').delete().eq('user_id', session.user.id)

    const rows = Array.from(selectedCats).map((category, i) => ({
      user_id: session.user.id,
      category,
      subcategory: null,
      rank: i + 1,
    }))

    if (rows.length > 0) {
      await supabase.from('user_interests').insert(rows)
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
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-ink-50">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-h2 font-bold text-ink mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <Card padding="md">
          <h2 className="text-body font-semibold text-ink mb-4">Profile</h2>
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
          <h2 className="text-body font-semibold text-ink mb-1">My Issues</h2>
          <p className="text-small text-ink-70 mb-4">
            Select the topics you want to stay informed about.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                title={cat.subline}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCats.has(cat.id)
                    ? 'bg-ink text-white border-ink'
                    : 'bg-card text-ink-70 border-divider hover:border-divider-strong'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save changes'}
        </Button>

        {/* Admin: Seed bills */}
        <div className="border-t border-divider pt-4">
          <p className="text-xs text-ink-50 mb-2">Admin</p>
          <SyncBillsButton />
        </div>

        {/* Sign out */}
        <div className="border-t border-divider pt-4">
          <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut}>
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
      setResult('Network error — try again')
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
        <p className={`text-xs mt-1 ${status === 'done' ? 'text-green-600' : 'text-red-500'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
