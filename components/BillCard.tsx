import Link from 'next/link'
import { cn, urgencyLabel } from '@/lib/utils'
import { deriveDisplayStatus, type BillStatus } from '@/lib/congress'

interface BillCardProps {
  bill: {
    id: string
    bill_number?: number
    title: string
    ai_summary?: string | null
    summary_text?: string | null
    status: string
    introduced_date: string
    urgency_score: number
    issue_tags?: string[] | null
  }
  compact?: boolean
}

export function BillCard({ bill, compact = false }: BillCardProps) {
  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary_text
  // bills.status is a closed token set (see BillStatus in lib/congress.ts);
  // the RPC SELECTs the column directly so the cast is safe at this boundary.
  const displayStatus = deriveDisplayStatus(bill.status as BillStatus, bill.introduced_date)

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
            {/* Federal-only per MVP scope (FEATURES.md); v2 reintroduces a level/state-code branch. */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              🇺🇸 Federal
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
          <span className="text-xs text-slate-400 capitalize">{displayStatus.replace('_', ' ')}</span>

          <span className="text-xs font-medium text-civic-600 group-hover:text-civic-700">
            Take action →
          </span>
        </div>
      </div>
    </Link>
  )
}
