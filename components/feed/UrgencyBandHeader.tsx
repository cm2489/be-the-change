import { BAND_META, type UrgencyBand } from '@/lib/feed/urgencyBands'

// Section header before each urgency band in the flat feed. Serif label (the only
// serif here) + a neutral count · note. No color, no shadow — band headers are
// neutral; the screen's one signal moment is the active bottom tab.
export function UrgencyBandHeader({ band, count }: { band: UrgencyBand; count: number }) {
  const { label, note } = BAND_META[band]
  return (
    <div className="mb-3 mt-9 flex items-baseline justify-between gap-3 first:mt-0">
      <h2 className="font-serif text-h3 text-ink">{label}</h2>
      <span className="shrink-0 text-meta text-ink-70">
        {count} {count === 1 ? 'bill' : 'bills'} · {note}
      </span>
    </div>
  )
}
