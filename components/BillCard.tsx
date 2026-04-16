import Link from 'next/link'
import { cn, urgencyLabel, formatDate } from '@/lib/utils'

interface BillCardProps {
  bill: {
    id: string
    bill_number: string
    title: string
    ai_summary?: string | null
    summary?: string | null
    level: string
    state_code?: string | null
    status: string
    vote_date?: string | null
    urgency_score: number
    tags?: string[] | null
  }
  compact?: boolean
}

export function BillCard({ bill, compact = false }: BillCardProps) {
  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary

  return (
    <Link href={`/bills/${bill.id}`}>
      <div
        className={cn(
          'bg-white rounded-2xl border border-slate-200 hover:border-civic-300 hover:shadow-md transition-all cursor-pointer group',
          compact ? 'p-4' : 'p-5'
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                urgency.color
              )}
            >
              {urgency.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {bill.level === 'federal'
                ? '🇺🇸 Federal'
                : `🏛️ ${bill.state_code}`}
            </span>
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
            {bill.bill_number}
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-semibold text-slate-900 group-hover:text-civic-700 transition-colors leading-snug',
            compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-3'
          )}
        >
          {bill.title}
        </h3>

        {/* Summary */}
        {!compact && displaySummary && (
          <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {displaySummary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          {bill.vote_date ? (
            <span className="text-xs text-slate-400">
              Vote: <span className="font-medium text-slate-600">{formatDate(bill.vote_date)}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 capitalize">{bill.status?.replace('_', ' ')}</span>
          )}

          <span className="text-xs font-medium text-civic-600 group-hover:text-civic-700">
            Take action →
          </span>
        </div>
      </div>
    </Link>
  )
}
