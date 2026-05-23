'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // DEPLOYMENT CHECKLIST — both of these must be added to Supabase:
    // Authentication → URL Configuration → Redirect URLs
    //   • http://localhost:3000/api/auth/callback  (local dev)
    //   • https://<your-production-domain>/api/auth/callback  (Vercel production)
    // Vercel preview deployments get unique URLs — either add a wildcard
    // (https://*.vercel.app/api/auth/callback) or test password reset on prod only.
    const redirectTo = `${window.location.origin}/api/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    // v2: map Supabase's "over_email_send_rate_limit" error to a friendlier message
    // rather than surfacing the raw error string.
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <MailCheck className="h-12 w-12 text-ink" />
          </div>
          <h1 className="text-h2 font-bold text-ink mb-2">Check your email</h1>
          {/* Intentionally vague: prevents email enumeration. Supabase returns success
              whether or not the address is registered — don't change this to "we sent
              you an email" without understanding the security implication. */}
          <p className="text-ink-70 text-small mb-6">
            If <span className="font-medium text-ink-85">{email}</span> is registered,
            you&apos;ll receive a reset link shortly.
          </p>
          <Link href="/login" className="text-small text-ink hover:underline font-medium">
            Back to sign in
          </Link>
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
          </Link>
        </div>

        <Card padding="lg" className="shadow-sm">
          <h1 className="text-h2 font-bold text-ink mb-2">Reset your password</h1>
          <p className="text-ink-70 text-small mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-small text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-small font-medium text-ink-85 mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-small text-ink-70">
            Remember your password?{' '}
            <Link href="/login" className="text-ink font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
