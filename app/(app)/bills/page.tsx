import { createServerClient } from '@/lib/supabase/server'
import { BillsFeed, type FeedBill } from '@/components/BillsFeed'
import { ClipboardList } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

export const dynamic = 'force-dynamic'

export default async function BillsPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id

  // Check for interests
  const { count: interestCount } = await supabase
    .from('user_interests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  let bills: FeedBill[] = []
  if ((interestCount ?? 0) > 0) {
    const { data } = await supabase.rpc('get_personalized_feed', {
      p_user_id: userId,
      p_offset: 0,
      p_limit: 30,
    })
    bills = (data ?? []) as FeedBill[]
  } else {
    const { data } = await supabase.rpc('get_default_feed', {
      p_offset: 0,
      p_limit: 30,
    })
    bills = (data ?? []) as FeedBill[]
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageHeader
        title="Issues"
        description={
          (interestCount ?? 0) > 0
            ? 'Matched to your interests, sorted by urgency.'
            : 'All active federal legislation, sorted by urgency.'
        }
      />

      {bills.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={ClipboardList}
            title="No bills synced yet"
            description="We sync legislation nightly. Check back tomorrow, or run a manual sync if you're an admin."
          />
        </Card>
      ) : (
        <BillsFeed
          initialBills={bills}
          mode={(interestCount ?? 0) > 0 ? 'personalized' : 'default'}
          userId={userId}
          pageSize={30}
        />
      )}
    </div>
  )
}
