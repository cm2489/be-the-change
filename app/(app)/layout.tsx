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
    .select('full_name, onboarding_completed, onboarding_skipped')
    .eq('id', session.user.id)
    .single()

  const userName = profile?.full_name || session.user.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-paper">
      <NavBar userName={userName} />
      <main className="lg:ml-64 pb-24 lg:pb-0 min-h-screen">{children}</main>
    </div>
  )
}
