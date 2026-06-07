'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { OravanWordmark } from '@/components/brand/OravanWordmark'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    // The session here comes from the recovery token exchanged by /api/auth/callback.
    // If the session is missing (expired link, direct navigation), updateUser will fail
    // with an auth error — we surface that in the error banner below.
    // v2: consider an explicit session check on mount and show a friendlier
    // "this link has expired, request a new one" state instead of the generic error.
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Sign out after reset so the user re-authenticates with their new password.
    // This also clears the recovery session, which has elevated privileges.
    await supabase.auth.signOut()
    router.push('/login?message=password_updated')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block" aria-label="Oravan home">
            <OravanWordmark className="h-8 text-ink" />
          </Link>
        </div>

        <Card padding="lg" className="shadow-sm">
          <h1 className="font-serif text-h2 text-ink mb-2">Set a new password</h1>
          <p className="text-ink-70 text-small mb-6">
            Must be at least 8 characters.
          </p>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}{' '}
              {error.toLowerCase().includes('session') || error.toLowerCase().includes('expired') ? (
                <Link href="/forgot-password" className="underline font-medium">
                  Request a new link.
                </Link>
              ) : null}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-small font-medium text-ink-85 mb-1.5">
                New password
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-small font-medium text-ink-85 mb-1.5">
                Confirm password
              </label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
