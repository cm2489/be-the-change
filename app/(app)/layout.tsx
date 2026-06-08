import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed_at')
    .eq('user_id', session.user.id)
    .single()

  // Name when we have it, else the full email (a real identifier) — never the
  // email local-part, which reads as a leaked fragment. Matches the dashboard greeting.
  const userName = profile?.full_name || session.user.email || undefined

  return (
    <div className="min-h-screen bg-paper">
      <NavBar userName={userName} />
      {/* Desktop: top masthead, no left offset; Mobile: bottom-nav clearance */}
      <main className="pb-20 lg:pb-0 min-h-screen">{children}</main>
    </div>
  )
}
