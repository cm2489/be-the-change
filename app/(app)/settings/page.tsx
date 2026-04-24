'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INTEREST_CATEGORIES } from '@/lib/interests'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [selectedSubcats, setSelectedSubcats] = useState<Set<string>>(new Set())
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

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').upsert({
      user_id: session.user.id,
      full_name: fullName,
      zip_code: zipCode,
    }, { onConflict: 'user_id' })

    // Rebuild interests
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
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={e => setZipCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-600"
              />
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">My Issues</h2>
          <p className="text-sm text-slate-500 mb-4">
            Select the specific topics you want to stay informed about.
          </p>
          <div className="space-y-4">
            {INTEREST_CATEGORIES.map(cat => (
              <div key={cat.id}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {cat.icon} {cat.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => toggleSub(sub.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedSubcats.has(sub.id)
                          ? 'bg-civic-600 text-white border-civic-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-civic-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save changes'}
        </Button>

        {/* Admin: Seed bills */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-400 mb-2">Admin</p>
          <SyncBillsButton />
        </div>

        {/* Sign out */}
        <div className="border-t border-slate-200 pt-4">
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
