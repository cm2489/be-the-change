import { cn, partyColor } from '@/lib/utils'

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
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-lg flex-shrink-0 overflow-hidden">
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
              <div className="font-semibold text-slate-900 text-sm leading-tight">
                {rep.full_name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                {repTitle(rep.chamber, rep.state, rep.district)}
              </div>
            </div>
            <span
              className={cn(
                'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
                partyColor(rep.party)
              )}
            >
              {rep.party}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <a
              href={`tel:${rep.dc_office_phone}`}
              onClick={onCallClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-action-500 hover:bg-action-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              📞 Call
            </a>
            {rep.website_url && (
              <a
                href={rep.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center py-2 px-3 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
              >
                🌐
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
