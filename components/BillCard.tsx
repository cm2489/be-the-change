import Link from 'next/link'
import { cn, urgencyLabel } from '@/lib/utils'
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

function formatVoteDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BillCard({ bill, compact = false }: BillCardProps) {
  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary
  const scope = bill.level === 'federal' ? 'Federal' : (bill.state_code ?? 'State')
  const voteDate = formatVoteDate(bill.vote_date)

  return (
    <Link href={`/bills/${bill.id}`} className="block group">
      <Card interactive className={cn('cursor-pointer', compact ? 'p-4' : 'p-4')}>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={urgency.variant}>{urgency.label}</Badge>
            <Badge variant="outline">{scope}</Badge>
          </div>
          <span className="t-mono text-fg-3 flex-shrink-0">{bill.bill_number}</span>
        </div>

        {/* Title */}
        <h3 className={cn(
          'text-[16px] font-semibold text-ink leading-snug',
          compact ? 'line-clamp-2' : 'line-clamp-3',
          'mb-1.5'
        )}>
          {bill.title}
        </h3>

        {/* Summary */}
        {!compact && displaySummary && (
          <p className="t-small text-fg-2 line-clamp-2 leading-relaxed mb-3">
            {displaySummary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-divider">
          <span className="t-small text-fg-3">
            {voteDate
              ? <>Vote: <span className="t-mono text-ink">{voteDate}</span></>
              : <span className="capitalize">{bill.status?.replace(/_/g, ' ')}</span>
            }
          </span>
          <span className="text-[12px] font-semibold text-ink group-hover:text-signal transition-colors">
            Take action →
          </span>
        </div>
      </Card>
    </Link>
  )
}
