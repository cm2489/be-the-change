import { createServerClient } from '@/lib/supabase/server'
import { BillCard } from '@/components/BillCard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Filter chips are static UI — active state would need a client component.
// For MVP: server-rendered, all bills shown. Filter interactivity is future.
const FILTERS = ['All', 'Urgent', 'Federal', 'State', 'Passed']

export default async function BillsPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const { count: interestCount } = await supabase
    .from('user_interests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  let bills: any[] = []
  if ((interestCount ?? 0) > 0) {
    const { data } = await supabase.rpc('get_personalized_feed', { p_user_id: userId, p_offset: 0, p_limit: 30 })
    bills = data ?? []
  } else {
    const { data } = await supabase.rpc('get_default_feed', { p_offset: 0, p_limit: 30 })
    bills = data ?? []
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* Heading */}
      <header className="mb-4">
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1.15, fontWeight: 400 }} className="text-ink">
          Issues
        </h1>
        <p className="t-small text-fg-2 mt-1">
          {(interestCount ?? 0) > 0
            ? 'Matched to your interests, sorted by urgency.'
            : 'All active federal legislation, sorted by urgency.'}
        </p>
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {FILTERS.map((f, i) => (
          <span
            key={f}
            className="flex-shrink-0 t-small font-semibold rounded-full px-3 py-1.5 cursor-pointer whitespace-nowrap"
            style={{
              background: i === 0 ? 'var(--ink)' : 'var(--card)',
              color: i === 0 ? 'var(--paper)' : 'var(--fg-2)',
              border: i === 0 ? 'none' : '1px solid var(--divider)',
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Bill list */}
      {bills.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="t-h3 text-ink mb-1">No bills synced yet</div>
          <p className="t-small text-fg-2 max-w-xs mx-auto">
            We sync legislation nightly. Check back tomorrow — or ask an admin to run a manual sync.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bills.map((bill: any) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
