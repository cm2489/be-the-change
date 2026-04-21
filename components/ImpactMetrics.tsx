import { Kpi } from '@/components/ui/kpi'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'

interface ImpactMetricsProps {
  totalCalls: number
  callsToday: number
  callsRemaining: number
  isPremium: boolean
}

export function ImpactMetrics({
  totalCalls,
  callsToday,
  callsRemaining,
  isPremium,
}: ImpactMetricsProps) {
  const limit = isPremium ? null : 5
  const pct = limit ? (callsToday / limit) * 100 : 0

  return (
    <Card>
      <p className="t-meta text-fg-3 mb-4">Your impact</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi value={totalCalls} label="Total calls" />
        <Kpi value={callsToday} label="Today" />
        <Kpi value={isPremium ? '∞' : callsRemaining} label="Remaining" />
      </div>

      {!isPremium && (
        <div className="mt-2">
          <div className="flex justify-between t-small text-fg-3 mb-2">
            <span>Daily usage</span>
            <span>{callsToday} / {limit}</span>
          </div>
          <Progress value={pct} />
          {callsRemaining === 0 && (
            <p className="mt-3 t-small text-fg-2 text-center">
              Daily limit reached.{' '}
              <a href="/upgrade" className="font-semibold text-signal hover:underline underline-offset-2">
                Upgrade for unlimited calls →
              </a>
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
