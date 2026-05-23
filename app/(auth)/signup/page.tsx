'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/onboarding')
      router.refresh()
    } else {
      setLoading(false)
      setCheckEmail(true)
    }
  }

  async function handleGoogleSignup() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <MailCheck className="h-12 w-12 text-ink" />
          </div>
          <h1 className="text-h2 font-bold text-ink mb-2">Check your email</h1>
          <p className="text-ink-70 text-small mb-6">
            We sent a confirmation link to <span className="font-medium text-ink-85">{email}</span>.
            Click it to activate your account and get started.
          </p>
          <p className="text-xs text-ink-50">
            Didn&apos;t get it? Check your spam folder, or{' '}
            <button
              className="underline hover:text-ink-70"
              onClick={() => setCheckEmail(false)}
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="text-2xl font-bold text-ink">Be The Change</div>
            <div className="text-small text-ink-70 mt-1">Your voice matters. Use it.</div>
          </Link>
        </div>

        <Card padding="lg" className="shadow-sm">
          <h1 className="text-h2 font-bold text-ink mb-2">Create your account</h1>
          <p className="text-ink-70 text-small mb-6">Free forever. No credit card needed.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-small text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-small font-medium text-ink-85 mb-1.5">
                Full name
              </label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-small font-medium text-ink-85 mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-small font-medium text-ink-85 mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-divider" />
            </div>
            <div className="relative flex justify-center text-xs text-ink-50">
              <span className="bg-card px-3">or sign up with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mt-4"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-small text-ink-70">
            Already have an account?{' '}
            <Link href="/login" className="text-ink font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-ink-50">
          By signing up, you agree to our{' '}
          <span className="underline cursor-pointer">Terms</span> and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>.
          No ads. No data selling.
        </p>
      </div>
    </div>
  )
}
