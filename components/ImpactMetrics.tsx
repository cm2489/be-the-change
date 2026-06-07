// Feature 7 will extend this with followed_bills and script_generations counts.
// If adding daily call limits or streaks, extend props here — do NOT re-add
// isPremium/freemium gating, that's v2 only (see FEATURES.md).
interface ImpactMetricsProps {
  totalCalls: number
  callsToday: number
}

export function ImpactMetrics({ totalCalls, callsToday }: ImpactMetricsProps) {
  return (
    <div className="bg-card rounded-xl border border-divider p-5">
      <h2 className="text-meta uppercase text-ink-50 mb-4">Your Impact</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-h2 font-bold text-ink">{totalCalls}</div>
          <div className="text-small text-ink-70 mt-0.5">Total calls</div>
        </div>
        <div className="text-center">
          <div className="text-h2 font-bold text-ink">{callsToday}</div>
          <div className="text-small text-ink-70 mt-0.5">Today</div>
        </div>
      </div>
    </div>
  )
}
