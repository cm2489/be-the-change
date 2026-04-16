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
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Your Impact
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-civic-600">{totalCalls}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total calls</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{callsToday}</div>
          <div className="text-xs text-slate-500 mt-0.5">Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-action-500">
            {isPremium ? '∞' : callsRemaining}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Remaining</div>
        </div>
      </div>

      {/* Daily limit bar */}
      {!isPremium && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Daily calls used</span>
            <span>
              {callsToday} / {limit}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 100 ? 'bg-red-400' : pct >= 80 ? 'bg-action-400' : 'bg-civic-500'
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          {callsRemaining === 0 && (
            <p className="mt-2 text-xs text-slate-500 text-center">
              Daily limit reached.{' '}
              <a href="/upgrade" className="text-civic-600 font-medium hover:underline">
                Upgrade for unlimited calls →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
