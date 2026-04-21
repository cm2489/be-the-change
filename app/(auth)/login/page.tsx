'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, FieldLabel } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400 }} className="text-ink">
              Be The Change
            </div>
            <div className="t-meta text-fg-3 mt-0.5">Not political. Just powerful.</div>
          </Link>
        </div>

        <div className="card">
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400 }} className="text-ink mb-5">
            Welcome back
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-oxblood/20 bg-oxblood-10 t-small text-oxblood">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="field">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="field">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-divider" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 t-meta text-fg-3" style={{ background: 'var(--card)' }}>or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <p className="mt-5 text-center t-small text-fg-2">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-ink hover:text-signal transition-colors">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center t-meta text-fg-3">
          No ads. No data selling. Your privacy is protected.
        </p>
      </div>
    </div>
  )
}
