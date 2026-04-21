import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { BillCard } from '@/components/BillCard'
import { Kpi } from '@/components/ui/kpi'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function getGreeting(): string {
  const hour = new Date().getUTCHours() - 5 // rough US Eastern offset
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDateLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed, onboarding_skipped, subscription_tier')
    .eq('id', userId)
    .single()

  const firstName = (profile?.full_name || session.user.email?.split('@')[0] || 'there').split(' ')[0]
  const isPremium = profile?.subscription_tier === 'premium'

  const { count: interestCount } = await supabase
    .from('user_interests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  let bills: any[] = []
  if ((interestCount ?? 0) > 0) {
    const { data } = await supabase.rpc('get_personalized_feed', { p_user_id: userId, p_offset: 0, p_limit: 10 })
    bills = data ?? []
  } else {
    const { data } = await supabase.rpc('get_default_feed', { p_offset: 0, p_limit: 10 })
    bills = data ?? []
  }

  const today = new Date().toISOString().split('T')[0]
  const { count: callsToday } = await supabase
    .from('call_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('call_date', today).in('status', ['completed', 'skipped'])

  const { count: totalCalls } = await supabase
    .from('call_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId).in('status', ['completed'])

  const todayCount = callsToday ?? 0
  const dailyLimit = 5
  const callsRemaining = isPremium ? Infinity : Math.max(0, dailyLimit - todayCount)
  const progressPct = isPremium ? 0 : (todayCount / dailyLimit) * 100

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

      {/* Date + greeting */}
      <header>
        <div className="t-meta text-fg-3">{getDateLabel()}</div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, lineHeight: 1.1, fontWeight: 400 }} className="text-ink mt-1">
          {getGreeting()}, {firstName}.
        </h1>
      </header>

      {/* Onboarding prompt */}
      {profile?.onboarding_skipped && !profile?.onboarding_completed && (
        <Card className="flex items-center justify-between gap-4 bg-paper-dark border-divider-strong">
          <div>
            <div className="t-h3 text-ink">Personalize your feed</div>
            <div className="t-small text-fg-2 mt-0.5">Tell us what issues matter to you — takes two minutes.</div>
          </div>
          <Link href="/onboarding" className="flex-shrink-0">
            <Button variant="primary" size="sm">Set up</Button>
          </Link>
        </Card>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Total" value={totalCalls ?? 0} sub="All-time" />
        <Kpi label="Today" value={todayCount} sub={isPremium ? 'Unlimited' : `Of ${dailyLimit}`} />
        <Kpi label="Remaining" value={isPremium ? '∞' : callsRemaining} accent={!isPremium && callsRemaining > 0} />
      </div>

      {/* Daily progress card */}
      {!isPremium && (
        <Card>
          <div className="flex items-center justify-between mb-2.5">
            <div className="t-small font-semibold text-fg-2">Daily calls</div>
            <div className="t-mono text-ink">{todayCount} / {dailyLimit}</div>
          </div>
          <Progress value={progressPct} />
          <div className="t-meta text-fg-3 mt-2">
            {callsRemaining > 0
              ? `${callsRemaining} more and you've hit your daily mark.`
              : 'Daily limit reached. Upgrade for unlimited calls.'}
          </div>
          {callsRemaining === 0 && (
            <Link href="/upgrade" className="t-small font-semibold text-signal hover:underline underline-offset-2 block mt-1">
              Upgrade to premium →
            </Link>
          )}
        </Card>
      )}

      {/* Bill feed */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="t-h3 text-ink">{(interestCount ?? 0) > 0 ? 'For you' : 'Trending issues'}</div>
          <Link href="/bills" className="t-small font-semibold text-ink hover:text-signal transition-colors">
            See all →
          </Link>
        </div>

        {bills.length === 0 ? (
          <Card>
            <div className="py-6 text-center">
              <div className="t-h3 text-ink mb-1">No issues synced yet</div>
              <div className="t-small text-fg-2">We sync new bills every night. Check back soon.</div>
            </div>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {bills.map((bill: any) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
