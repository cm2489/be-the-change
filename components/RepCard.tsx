import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const initials = rep.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')

  const partyClass = party === 'D' ? 'is-d' : party === 'R' ? 'is-r' : 'is-i'

  return (
    <Card interactive>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-paper-dark flex items-center justify-center overflow-hidden flex-shrink-0">
          {rep.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rep.photo_url}
              alt={rep.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="t-h3 text-ink">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + party badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="t-h3 text-ink truncate">{rep.full_name}</div>
              <div className="t-small text-fg-2 truncate mt-0.5">{rep.title}</div>
            </div>
            {party && (
              <span className={`party-badge ${partyClass} flex-shrink-0`}>{party}</span>
            )}
          </div>

          {/* Contact actions */}
          <div className="mt-4 flex items-center gap-2">
            {rep.phone && (
              <a href={`tel:${rep.phone}`} onClick={onCallClick}>
                <Button variant="action" size="sm">Call</Button>
              </a>
            )}
            {rep.email && (
              <a href={`mailto:${rep.email}`}>
                <Button variant="outline" size="sm">Email</Button>
              </a>
            )}
            {rep.website_url && (
              <a href={rep.website_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">Website</Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
