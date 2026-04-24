// Feature 7 will extend this with followed_bills and script_generations counts.
// If adding daily call limits or streaks, extend props here — do NOT re-add
// isPremium/freemium gating, that's v2 only (see FEATURES.md).
interface ImpactMetricsProps {
  totalCalls: number
  callsToday: number
}

export function ImpactMetrics({ totalCalls, callsToday }: ImpactMetricsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Your Impact
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-civic-600">{totalCalls}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total calls</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{callsToday}</div>
          <div className="text-xs text-slate-500 mt-0.5">Today</div>
        </div>
      </div>
    </div>
  )
}
