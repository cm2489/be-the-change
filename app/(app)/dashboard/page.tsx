import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { BillCard } from '@/components/BillCard'
import { ImpactMetrics } from '@/components/ImpactMetrics'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed_at')
    .eq('user_id', userId)
    .single()

  const userName = profile?.full_name || session.user.email?.split('@')[0] || 'there'

  // Check if user has any interests
  const { count: interestCount } = await supabase
    .from('user_interests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Load personalized bill feed (RPCs not yet live — fails silently, shows empty state)
  let bills: any[] = []
  if ((interestCount ?? 0) > 0) {
    const { data } = await supabase.rpc('get_personalized_feed', {
      p_user_id: userId,
      p_offset: 0,
      p_limit: 10,
    })
    bills = data ?? []
  } else {
    const { data } = await supabase.rpc('get_default_feed', {
      p_offset: 0,
      p_limit: 10,
    })
    bills = data ?? []
  }

  // Call metrics
  // NOTE: setHours(0,0,0,0) resolves to UTC midnight on Vercel, not the user's local
  // timezone. A user in California making a call at 6pm PST will see it counted on the
  // next UTC day. Fix properly in v2 when user timezone storage is added.
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [{ count: callsToday }, { count: totalCalls }] = await Promise.all([
    supabase
      .from('call_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('call_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  const todayCount = callsToday ?? 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {userName}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here&apos;s what&apos;s happening with issues you care about.
        </p>
      </div>

      {/* Onboarding prompt for users who skipped or came via email confirmation */}
      {!profile?.onboarding_completed_at && (
        <div className="mb-6 bg-civic-50 border border-civic-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-civic-800 text-sm">
              Personalize your feed
            </div>
            <div className="text-civic-600 text-xs mt-0.5">
              Tell us what issues matter to you — takes 2 minutes.
            </div>
          </div>
          <Link href="/onboarding">
            <Button size="sm">Set up</Button>
          </Link>
        </div>
      )}

      {/* Impact metrics */}
      <div className="mb-6">
        <ImpactMetrics
          totalCalls={totalCalls ?? 0}
          callsToday={todayCount}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/bills">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-civic-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-semibold text-slate-900">Browse Issues</div>
            <div className="text-xs text-slate-500 mt-0.5">See all upcoming votes</div>
          </div>
        </Link>
        <Link href="/representatives">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-civic-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="text-2xl mb-2">📞</div>
            <div className="text-sm font-semibold text-slate-900">My Representatives</div>
            <div className="text-xs text-slate-500 mt-0.5">Your federal reps</div>
          </div>
        </Link>
      </div>

      {/* Personalized bill feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {(interestCount ?? 0) > 0 ? 'For You' : 'Trending Issues'}
          </h2>
          <Link href="/bills" className="text-sm text-civic-600 hover:underline font-medium">
            See all →
          </Link>
        </div>

        {bills.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-semibold text-slate-700 mb-1">No issues synced yet</div>
            <div className="text-sm text-slate-500">
              Check back soon — we sync new bills every night.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill: any) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
