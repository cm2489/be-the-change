import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CallengePage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

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
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* Heading */}
      <div className="flex items-start justify-between mb-5">
        <header>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1.15, fontWeight: 400 }} className="text-ink">
            Callenge
          </h1>
          <p className="t-small text-fg-2 mt-1">Commit to calls with your people.</p>
        </header>
        <Link href="/callenge/new">
          <Button variant="primary" size="sm">+ New</Button>
        </Link>
      </div>

      {callenges.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="t-h2 text-ink mb-1">No callenges yet</h2>
            <p className="t-small text-fg-2 max-w-xs mx-auto mb-5">
              Create a callenge to invite your community to make calls together.
            </p>
            <Link href="/callenge/new">
              <Button variant="primary">Create your first Callenge</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {callenges.map((c: any) => {
            const pct = Math.min(100, (c.my_calls / c.goal_calls) * 100)
            const isActive = c.status === 'active'
            const isDone = c.status === 'completed'
            return (
              <Link key={c.id} href={`/callenge/${c.id}`} className="block group">
                <Card interactive className="cursor-pointer">
                  {/* Title + status */}
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="t-h3 text-ink truncate">{c.title}</div>
                    <Badge variant={isDone ? 'passed' : isActive ? 'soon' : 'neutral'} className="flex-shrink-0">
                      {isDone ? 'Done' : isActive ? 'Active' : c.status}
                    </Badge>
                  </div>

                  {c.description && (
                    <p className="t-small text-fg-2 line-clamp-2 mb-3">{c.description}</p>
                  )}

                  {/* Progress */}
                  <div className="flex justify-between t-meta text-fg-3 mb-1.5">
                    <span>Your progress</span>
                    <span className="t-mono text-ink">{c.my_calls} / {c.goal_calls} calls</span>
                  </div>
                  <Progress value={pct} />

                  {/* Date range */}
                  <div className="t-meta text-fg-3 mt-2.5">
                    {formatDate(c.start_date)} — {formatDate(c.end_date)}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
