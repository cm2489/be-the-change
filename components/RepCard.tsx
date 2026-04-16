import { cn, partyColor } from '@/lib/utils'

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
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-lg flex-shrink-0 overflow-hidden">
          {rep.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rep.photo_url} alt={rep.full_name} className="w-full h-full object-cover" />
          ) : (
            rep.full_name.charAt(0)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900 text-sm leading-tight">
                {rep.full_name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{rep.title}</div>
            </div>
            {rep.party && (
              <span
                className={cn(
                  'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
                  partyColor(rep.party)
                )}
              >
                {rep.party.replace('Republican', 'R').replace('Democratic', 'D').replace('Independent', 'I')}
              </span>
            )}
          </div>

          {/* Contact buttons */}
          <div className="flex items-center gap-2 mt-3">
            {rep.phone && (
              <a
                href={`tel:${rep.phone}`}
                onClick={onCallClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-action-500 hover:bg-action-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                📞 Call
              </a>
            )}
            {rep.email && (
              <a
                href={`mailto:${rep.email}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-civic-300 text-civic-700 hover:bg-civic-50 text-xs font-semibold rounded-lg transition-colors"
              >
                ✉️ Email
              </a>
            )}
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
