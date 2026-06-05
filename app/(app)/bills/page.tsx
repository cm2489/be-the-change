import { createServerClient } from '@/lib/supabase/server'
import { BillsFeed, type FeedBill } from '@/components/BillsFeed'
import { ClipboardList } from 'lucide-react'
import { redirect } from 'next/navigation'

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-bold text-ink">Issues</h1>
          <p className="text-small text-ink-50 mt-1">
            {(interestCount ?? 0) > 0
              ? 'Matched to your interests, sorted by urgency.'
              : 'All active federal legislation, sorted by urgency.'}
          </p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="bg-card rounded-2xl border border-divider p-12 text-center">
          <div className="mb-4 flex justify-center">
            <ClipboardList className="h-10 w-10 text-ink-50" />
          </div>
          <h2 className="text-h3 font-semibold text-ink-70 mb-2">No bills synced yet</h2>
          <p className="text-small text-ink-50 max-w-xs mx-auto">
            We sync legislation nightly. Check back tomorrow — or run a manual sync if
            you&apos;re an admin.
          </p>
        </div>
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
