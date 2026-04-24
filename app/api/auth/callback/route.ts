import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` is set by callers that need a specific post-auth destination,
  // e.g. forgot-password sets next=/reset-password.
  // IMPORTANT: only redirect to same-origin paths to prevent open-redirect attacks.
  // Before expanding this to accept full URLs (e.g. for OAuth), add an origin check.
  const next = searchParams.get('next') ?? null

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try { cookieStore.set({ name, value, ...options }) } catch {}
          },
          remove(name: string, options: CookieOptions) {
            try { cookieStore.set({ name, value: '', ...options }) } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If the caller specified an explicit destination (e.g. /reset-password),
      // honour it — don't override with the onboarding check.
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // For sign-up confirmation emails, the user may never have completed onboarding.
      // Check their profile and send them to /onboarding if so.
      // Future: if we add more onboarding steps (e.g. address verification, push opt-in),
      // consider a richer onboarding_step enum rather than a single completed_at timestamp.
      //
      // Note: profiles.email_verified_at is not currently set here. When we add
      // civic-action gating (Feature 4/5), set it in this branch:
      //   await supabase.from('profiles').update({ email_verified_at: new Date() })
      //     .eq('user_id', user.id)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('user_id', user?.id)
        .single()

      const destination = profile?.onboarding_completed_at ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
