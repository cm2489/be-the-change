'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INTEREST_CATEGORIES } from '@/lib/interests'
import { Button } from '@/components/ui/button'
import { Input, FieldLabel } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [selectedSubcats, setSelectedSubcats] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, zip_code, state_code')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setZipCode(profile.zip_code || '')
        setStateCode(profile.state_code || '')
      }

      const { data: interests } = await supabase
        .from('user_interests')
        .select('subcategory')
        .eq('user_id', session.user.id)

      const subs = new Set<string>(
        (interests ?? []).map((i: any) => i.subcategory).filter(Boolean)
      )
      setSelectedSubcats(subs)

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleSub(id: string) {
    setSelectedSubcats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: fullName,
      zip_code: zipCode,
      state_code: stateCode,
    })

    await supabase.from('user_interests').delete().eq('user_id', session.user.id)

    const rows = Array.from(selectedSubcats).map((subId, i) => {
      const cat = INTEREST_CATEGORIES.find(c => c.subcategories.some(s => s.id === subId))
      return {
        user_id: session.user.id,
        category: cat?.id || 'other',
        subcategory: subId,
        rank: i + 1,
      }
    })

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
      <div className="max-w-2xl mx-auto px-4 py-10 flex items-center justify-center gap-3 t-small text-fg-3">
        <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin flex-shrink-0" />
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      <header className="mb-5">
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1.15, fontWeight: 400 }} className="text-ink">
          Settings
        </h1>
      </header>

      <div className="space-y-4">

        {/* Profile */}
        <Card>
          <h2 className="t-h3 text-ink mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="field">
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="field">
              <FieldLabel htmlFor="zipCode">ZIP code</FieldLabel>
              <Input
                id="zipCode"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 10001"
              />
            </div>
          </div>
        </Card>

        {/* Interests */}
        <Card>
          <h2 className="t-h3 text-ink mb-1">My issues</h2>
          <p className="t-small text-fg-2 mb-4">
            Select the specific topics you want to stay informed about.
          </p>
          <div className="space-y-5">
            {INTEREST_CATEGORIES.map(cat => (
              <div key={cat.id}>
                <div className="t-meta font-semibold text-fg-2 mb-2.5">{cat.label}</div>
                <div className="flex flex-wrap gap-2">
                  {cat.subcategories.map(sub => (
                    <Chip
                      key={sub.id}
                      selected={selectedSubcats.has(sub.id)}
                      onClick={() => toggleSub(sub.id)}
                    >
                      {sub.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Save */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </Button>

        {/* Admin */}
        <div className="border-t border-divider pt-4">
          <p className="t-meta text-fg-3 mb-2">Admin</p>
          <SyncBillsButton />
        </div>

        {/* Sign out */}
        <div className="border-t border-divider pt-4">
          <Button variant="ghost" className="text-oxblood hover:text-oxblood/80" onClick={handleSignOut}>
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
        <p className={`t-meta mt-1.5 ${status === 'done' ? 'text-moss' : 'text-oxblood'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
