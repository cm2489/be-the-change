import Link from 'next/link'
import { cn, urgencyLabel, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

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
    <Link href={`/bills/${bill.id}`} className="block group">
      <Card interactive className={cn('cursor-pointer', compact ? 'p-4' : 'p-5')}>
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant={urgency.variant}>{urgency.label}</Badge>
          <Badge variant="federal">
            {bill.level === 'federal' ? 'Federal' : bill.state_code}
          </Badge>
          <span className="t-mono text-fg-3 ml-auto">{bill.bill_number}</span>
        </div>

        {/* Title */}
        <h3 className={cn('t-h3 text-ink leading-snug', compact ? 'line-clamp-2' : 'line-clamp-3')}>
          {bill.title}
        </h3>

        {/* Summary */}
        {!compact && displaySummary && (
          <p className="mt-2 t-small text-fg-2 line-clamp-2 leading-relaxed">
            {displaySummary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {bill.vote_date ? (
            <span className="t-small text-fg-3">
              Vote: <span className="font-medium text-ink">{formatDate(bill.vote_date)}</span>
            </span>
          ) : (
            <span className="t-small text-fg-3 capitalize">{bill.status?.replace(/_/g, ' ')}</span>
          )}
          <span className="t-small font-semibold text-signal group-hover:underline underline-offset-2">
            Take action →
          </span>
        </div>
      </Card>
    </Link>
  )
}
