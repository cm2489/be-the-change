import { createServerClient } from '@/lib/supabase/server'
import { BillCard } from '@/components/BillCard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BillsPage() {
  const supabase = createServerClient()
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

  let bills: any[] = []
  if ((interestCount ?? 0) > 0) {
    const { data } = await supabase.rpc('get_personalized_feed', {
      p_user_id: userId,
      p_offset: 0,
      p_limit: 30,
    })
    bills = data ?? []
  } else {
    const { data } = await supabase.rpc('get_default_feed', {
      p_offset: 0,
      p_limit: 30,
    })
    bills = data ?? []
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
          <p className="text-sm text-slate-500 mt-1">
            {(interestCount ?? 0) > 0
              ? 'Matched to your interests, sorted by urgency.'
              : 'All active federal legislation, sorted by urgency.'}
          </p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No bills synced yet</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            We sync legislation nightly. Check back tomorrow — or run a manual sync if
            you&apos;re an admin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill: any) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
