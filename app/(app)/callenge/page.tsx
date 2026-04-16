import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CallengePage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id

  // My callenges (created + joined)
  const { data: myParticipations } = await supabase
    .from('callenge_participants')
    .select('*, callenge:callenges(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  const callenges = (myParticipations ?? []).map((p: any) => ({
    ...p.callenge,
    my_calls: p.calls_completed,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Callenge 🏆</h1>
          <p className="text-sm text-slate-500 mt-1">
            Commit to calls with friends, family, and neighbors.
          </p>
        </div>
        <Link href="/callenge/new">
          <Button>+ New Callenge</Button>
        </Link>
      </div>

      {callenges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No callenges yet</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            Create a callenge to invite your community to make calls together. Collective
            action amplifies your impact.
          </p>
          <Link href="/callenge/new">
            <Button>Create your first Callenge</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {callenges.map((c: any) => {
            const pct = Math.min(100, (c.my_calls / c.goal_calls) * 100)
            return (
              <Link key={c.id} href={`/callenge/${c.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-civic-300 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'completed'
                          ? 'bg-civic-100 text-civic-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{c.description}</p>
                  )}

                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Your progress</span>
                      <span>
                        {c.my_calls} / {c.goal_calls} calls
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-civic-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    {formatDate(c.start_date)} — {formatDate(c.end_date)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
