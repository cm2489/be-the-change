import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Phone } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

// One row per logged call. bill / representative are embedded from the stored
// bill_id / representative_id FKs — i.e. the bill and rep actually called at the
// time, NOT a current-rep re-lookup (a user's reps can change; the log must show
// who was called). Embeds are typed nullable defensively, though both FKs are
// NOT NULL + ON DELETE CASCADE so they're present in practice.
// See docs/deferred.md#call-events-cascade-durability.
interface CallHistoryRow {
  id: string
  bill_id: string
  created_at: string
  bill: { title: string; full_identifier: string } | null
  representative: { full_name: string } | null
}

function formatCallDate(iso: string): string {
  // Server-rendered, so this resolves in the server's tz (UTC on Vercel) — the
  // same date-boundary nuance already tracked in docs/deferred.md#dashboard-timezone.
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ImpactPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id

  // Personal totals. SELECT RLS on both tables is auth.uid() = user_id; the
  // explicit user_id filter is belt-and-suspenders so totals are never global.
  // head:true returns the count without row payloads.
  const [{ count: callsMade }, { count: scriptsGenerated }] = await Promise.all([
    supabase
      .from('call_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('script_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  // Reverse-chron call history, same user-scoping. Embeds resolve the bill/rep
  // actually called via the stored FKs; bill_id drives the per-row link.
  const { data: history } = await supabase
    .from('call_events')
    .select(
      'id, bill_id, created_at, bill:bills(title, full_identifier), representative:representatives(full_name)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<CallHistoryRow[]>()

  const calls = history ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-h2 font-bold text-ink">Your Impact</h1>
        <p className="text-ink-70 text-small mt-1">
          The calls you&apos;ve made and the scripts you&apos;ve generated.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <div className="text-h1 font-bold text-ink">{callsMade ?? 0}</div>
          <div className="text-small text-ink-70 mt-1">Calls made</div>
        </Card>
        <Card padding="md">
          <div className="text-h1 font-bold text-ink">{scriptsGenerated ?? 0}</div>
          <div className="text-small text-ink-70 mt-1">Scripts generated</div>
        </Card>
      </div>

      {/* Call history */}
      <div className="mt-8">
        <h2 className="text-h3 font-bold text-ink mb-4">Call history</h2>

        {calls.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="mb-3 flex justify-center">
              <Phone className="h-8 w-8 text-ink-50" />
            </div>
            <div className="font-semibold text-ink-85 mb-1">No calls logged yet</div>
            <div className="text-small text-ink-70">
              When you call a representative about a bill, it&apos;ll show up here.
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <ul className="divide-y divide-divider">
              {calls.map(call => (
                <li key={call.id}>
                  <Link
                    href={`/bills/${call.bill_id}`}
                    className="flex items-start justify-between gap-4 py-3 transition-opacity hover:opacity-70"
                  >
                    <div className="min-w-0">
                      <div className="text-small font-medium text-ink truncate">
                        {call.bill?.title ?? call.bill?.full_identifier ?? 'A bill'}
                      </div>
                      <div className="text-small text-ink-70 mt-0.5">
                        Called {call.representative?.full_name ?? 'your representative'}
                      </div>
                    </div>
                    <div className="text-small text-ink-50 shrink-0">
                      {formatCallDate(call.created_at)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
