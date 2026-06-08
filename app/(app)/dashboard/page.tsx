import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { BillCard } from '@/components/BillCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

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

  // Greet by name only when we actually have one — never fall back to the email
  // local-part, which leaks a raw identifier into the brand's warmest moment.
  const fullName = profile?.full_name?.trim()

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Welcome header */}
      <PageHeader
        title={fullName ? `Welcome back, ${fullName}` : 'Welcome back'}
        description="Here's what's happening with issues you care about."
      />

      {/* Onboarding prompt for users who skipped or came via email confirmation */}
      {!profile?.onboarding_completed_at && (
        <div className="mb-6 bg-paper-dark border border-divider rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-ink text-small">
              Personalize your feed
            </div>
            <div className="text-ink-70 text-small mt-0.5">
              Tell us what issues matter to you. Takes 2 minutes.
            </div>
          </div>
          <Link href="/onboarding">
            <Button size="sm">Set up</Button>
          </Link>
        </div>
      )}

      {/* Personalized bill feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-h3 text-ink">
            {(interestCount ?? 0) > 0 ? 'For You' : 'Trending Issues'}
          </h2>
          <Link href="/bills" className="text-small text-ink hover:underline font-medium">
            See all →
          </Link>
        </div>

        {bills.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={ClipboardList}
              title="No issues synced yet"
              description="Check back soon. We sync new bills every night."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {bills.map((bill: any) => (
              <BillCard key={bill.id} bill={bill} variant="v4" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
