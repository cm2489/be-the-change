import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { BillCard } from '@/components/BillCard'
import { ImpactMetrics } from '@/components/ImpactMetrics'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed, onboarding_skipped, subscription_tier')
    .eq('id', userId)
    .single()

  const firstName = (profile?.full_name || session.user.email?.split('@')[0] || 'there')
    .split(' ')[0]
  const isPremium = profile?.subscription_tier === 'premium'

  const { count: interestCount } = await supabase
    .from('user_interests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

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

  const today = new Date().toISOString().split('T')[0]
  const { count: callsToday } = await supabase
    .from('call_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('call_date', today)
    .in('status', ['completed', 'skipped'])

  const { count: totalCalls } = await supabase
    .from('call_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['completed'])

  const todayCount = callsToday ?? 0
  const callsRemaining = isPremium ? Infinity : Math.max(0, 5 - todayCount)

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

      {/* Greeting */}
      <header>
        <h1 className="t-h1 text-ink">Good to see you, {firstName}.</h1>
        <p className="t-body text-fg-2 mt-1">
          {(interestCount ?? 0) > 0
            ? "Here’s what’s happening with issues you care about."
            : "Discover what’s moving through Congress right now."}
        </p>
      </header>

      {/* Onboarding prompt */}
      {profile?.onboarding_skipped && !profile?.onboarding_completed && (
        <Card className="flex items-center justify-between gap-4 bg-paper-dark border-divider-strong">
          <div>
            <div className="t-h3 text-ink">Personalize your feed</div>
            <div className="t-small text-fg-2 mt-1">
              Tell us what issues matter to you — takes two minutes.
            </div>
          </div>
          <Link href="/onboarding" className="flex-shrink-0">
            <Button variant="primary" size="sm">Set up</Button>
          </Link>
        </Card>
      )}

      {/* Impact metrics */}
      <ImpactMetrics
        totalCalls={totalCalls ?? 0}
        callsToday={todayCount}
        callsRemaining={callsRemaining === Infinity ? 999 : callsRemaining}
        isPremium={isPremium}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/bills">
          <Card interactive className="cursor-pointer">
            <div className="t-meta text-fg-3 mb-2">Legislation</div>
            <div className="t-h3 text-ink">Browse issues</div>
            <div className="t-small text-fg-2 mt-0.5">All upcoming votes</div>
          </Card>
        </Link>
        <Link href="/representatives">
          <Card interactive className="cursor-pointer">
            <div className="t-meta text-fg-3 mb-2">Your reps</div>
            <div className="t-h3 text-ink">My representatives</div>
            <div className="t-small text-fg-2 mt-0.5">Federal, state &amp; local</div>
          </Card>
        </Link>
      </div>

      {/* Bill feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="t-h2 text-ink">
            {(interestCount ?? 0) > 0 ? 'For you' : 'Trending issues'}
          </h2>
          <Link href="/bills" className="t-small font-semibold text-signal hover:underline underline-offset-2">
            See all →
          </Link>
        </div>

        {bills.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <div className="t-h3 text-ink mb-1">No issues synced yet</div>
              <div className="t-small text-fg-2">
                We sync new bills every night. Check back soon.
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {bills.map((bill: any) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
