import { Phone, Globe } from 'lucide-react'

interface RepCardProps {
  rep: {
    id: string
    full_name: string
    party: string
    state: string
    district: string | null
    chamber: 'house' | 'senate'
    dc_office_phone: string
    website_url?: string | null
    photo_url?: string | null
  }
  onCallClick?: () => void
}

function repTitle(chamber: 'house' | 'senate', state: string, district: string | null): string {
  if (chamber === 'senate') return `U.S. Senator, ${state}`
  const isAtLarge = !district || district === '0'
  return isAtLarge
    ? `U.S. Representative, ${state} (At Large)`
    : `U.S. Representative, ${state}-${district}`
}

export function RepCard({ rep, onCallClick }: RepCardProps) {
  return (
    <div className="bg-card rounded-xl border border-divider p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-ink-10 flex items-center justify-center text-ink-50 font-semibold text-h3 flex-shrink-0 overflow-hidden">
          {rep.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
          ) : (
            rep.full_name.charAt(0)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-ink text-small leading-tight">
                {rep.full_name}
              </div>
              <div className="text-small text-ink-70 mt-0.5 leading-tight">
                {repTitle(rep.chamber, rep.state, rep.district)}
              </div>
            </div>
            {/* Neutral party pill — same outline language as the bill status pills.
                Party color (blue/red) is deliberately not rendered on a nonpartisan tool. */}
            <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">
              {rep.party}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <a
              href={`tel:${rep.dc_office_phone}`}
              onClick={onCallClick}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-signal text-white text-small font-semibold hover:bg-signal-hover transition-colors"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Call
            </a>
            {rep.website_url && (
              <a
                href={rep.website_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${rep.full_name} official website`}
                className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-divider-strong text-ink-50 hover:bg-ink-10 transition-colors"
              >
                <Globe className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
