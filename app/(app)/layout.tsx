import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Masthead } from '@/components/layout/Masthead'
import { BottomTabBar } from '@/components/layout/BottomTabBar'

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
      <Masthead userName={userName} />
      {/* Mobile: clear the fixed bottom tab bar; desktop has no bottom bar. */}
      <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      <BottomTabBar />
    </div>
  )
}
