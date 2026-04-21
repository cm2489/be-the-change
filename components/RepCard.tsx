import { Card } from '@/components/ui/card'
import { partyLetter } from '@/lib/utils'

interface RepCardProps {
  rep: {
    id: string
    full_name: string
    title: string
    level: string
    party: string | null
    phone: string | null
    email: string | null
    website_url?: string | null
    photo_url?: string | null
  }
  onCallClick?: () => void
}

export function RepCard({ rep, onCallClick }: RepCardProps) {
  const party = partyLetter(rep.party)
  const partyClass = party === 'D' ? 'is-d' : party === 'R' ? 'is-r' : 'is-i'
  const initials = rep.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')

  return (
    <Card interactive className="flex items-start gap-3">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-paper-dark border border-divider flex items-center justify-center overflow-hidden flex-shrink-0">
        {rep.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18 }} className="text-ink">
            {initials}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + party */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-ink leading-tight truncate">{rep.full_name}</div>
            <div className="t-meta text-fg-3 mt-0.5 truncate">{rep.title}</div>
          </div>
          {party && <span className={`party-badge ${partyClass} flex-shrink-0`}>{party}</span>}
        </div>

        {/* Actions */}
        <div className="mt-2.5 flex items-center gap-1.5">
          {rep.phone && (
            <a
              href={`tel:${rep.phone}`}
              onClick={onCallClick}
              className="flex-1 flex items-center justify-center gap-1.5 h-[34px] px-3 rounded-lg font-semibold text-[12px] text-white transition-colors"
              style={{ background: '#E65A2B', fontFamily: "'Inter Tight', sans-serif" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.53 2 2 0 0 1 3.6 2.36h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Call · {rep.phone}
            </a>
          )}
          {rep.email && (
            <a
              href={`mailto:${rep.email}`}
              className="h-[34px] px-3 rounded-lg border border-divider bg-card text-ink flex items-center justify-center transition-colors hover:border-divider-strong"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </a>
          )}
          {rep.website_url && (
            <a
              href={rep.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[34px] px-3 rounded-lg border border-divider bg-card text-ink flex items-center justify-center transition-colors hover:border-divider-strong"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
