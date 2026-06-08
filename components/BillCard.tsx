import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn, urgencyLabel, formatBillIdentifier } from '@/lib/utils'
import { deriveDisplayStatus, type BillStatus } from '@/lib/congress'
import { INTEREST_CATEGORIES } from '@/lib/interests'

// id -> user-facing label for the V4 interest pill (match-only).
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  INTEREST_CATEGORIES.map((c) => [c.id, c.label])
)

interface BillCardProps {
  bill: {
    id: string
    full_identifier?: string
    title: string
    ai_summary?: string | null
    ai_headline?: string | null
    summary_text?: string | null
    status: string
    introduced_date: string
    urgency_score: number
    issue_tags?: string[] | null
    matched_tags?: string[] | null
  }
  // 'v4' is the title-led + Decoded-container feed card (/bills). 'classic' is
  // the legacy card still used on /dashboard — rendered verbatim, do not change.
  variant?: 'classic' | 'v4'
  // Retained as the seam for a future compact feed-card variant; orthogonal to
  // `variant`. Currently consumed only by the classic path.
  compact?: boolean
}

export function BillCard({ bill, variant = 'classic', compact = false }: BillCardProps) {
  if (variant === 'v4') {
    return <BillCardV4 bill={bill} />
  }

  // --- classic (verbatim; /dashboard renders this — do not "improve" it) ---
  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary_text
  // bills.status is a closed token set (see BillStatus in lib/congress.ts);
  // the RPC SELECTs the column directly so the cast is safe at this boundary.
  const displayStatus = deriveDisplayStatus(bill.status as BillStatus, bill.introduced_date)

  return (
    <Link href={`/bills/${bill.id}`}>
      <div
        className={cn(
          'bg-card rounded-xl border border-divider hover:border-divider-strong hover:shadow-md transition-all cursor-pointer group',
          compact ? 'p-4' : 'p-5'
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">
              {urgency.label}
            </span>
            {/* Federal-only per MVP scope (FEATURES.md); v2 reintroduces a level/state-code branch. */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">
              Federal
            </span>
          </div>
          {bill.full_identifier && (
            <span className="font-mono text-meta text-ink-50 whitespace-nowrap flex-shrink-0">
              {formatBillIdentifier(bill.full_identifier)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-semibold text-ink group-hover:text-ink transition-colors leading-snug',
            compact ? 'text-small line-clamp-2' : 'text-body line-clamp-3'
          )}
        >
          {bill.title}
        </h3>

        {/* Summary */}
        {!compact && displaySummary && (
          <p className="mt-2 text-small text-ink-70 line-clamp-2 leading-relaxed">
            {displaySummary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-meta text-ink-50 capitalize">{displayStatus.replace('_', ' ')}</span>

          <span className="inline-flex items-center gap-1 text-small font-medium text-ink">
            Take action
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// V4 "decode-is-the-card" — spec: docs/DESIGN_DECISIONS.md. The official title is
// a quiet source line floating on the page; the single card below IS the AI
// plain-language answer plus its meta and action. One surface, no nested cards.
function BillCardV4({ bill }: { bill: BillCardProps['bill'] }) {
  const urgency = urgencyLabel(bill.urgency_score)
  const displayStatus = deriveDisplayStatus(bill.status as BillStatus, bill.introduced_date)
  const citation = bill.full_identifier ? formatBillIdentifier(bill.full_identifier) : null
  const headline = bill.ai_headline?.trim() || null
  const summary = (bill.ai_summary || bill.summary_text)?.trim() || null
  // Match-only: matched_tags is present only on the personalized feed. Map the
  // first matched id to its label; skip unknown ids and the default feed (no
  // matched_tags) -> no pill.
  const matchedLabel =
    bill.matched_tags?.map((id) => CATEGORY_LABELS[id]).find(Boolean) ?? null

  return (
    <Link
      href={`/bills/${bill.id}`}
      aria-label={headline ?? bill.title}
      className="block group rounded-xl focus-visible:shadow-focus focus-visible:outline-none"
    >
      {/* Official title — a quiet source line on the paper, above the card. Clamp
          via max-height + overflow-hidden, NEVER line-clamp — the -webkit-box
          line-clamp kills the citation float in WebKit/Safari. */}
      <p className="px-1 mb-2.5 font-serif italic text-small text-ink-70 leading-snug overflow-hidden max-h-title break-words">
        {citation && (
          <span className="float-right not-italic font-mono text-meta text-ink-70 whitespace-nowrap ml-1.5">
            {citation}
          </span>
        )}
        {bill.title}
      </p>

      {/* The card IS the decoded answer + its meta + action (no inner panel) */}
      <div className="bg-card rounded-xl border border-divider p-5 transition-[border-color] duration-component ease-standard group-hover:border-divider-strong motion-reduce:transition-none">
        <p className="font-serif text-small text-ink-70 mb-1">Decoded</p>
        {headline ? (
          <>
            <p className="text-h3 font-medium text-ink leading-snug break-words">{headline}</p>
            {summary && (
              <p className="text-small text-ink-70 leading-snug line-clamp-2 mt-1.5 break-words">
                {summary}
              </p>
            )}
          </>
        ) : summary ? (
          <p className="text-body text-ink leading-snug line-clamp-3 break-words">{summary}</p>
        ) : (
          <p className="text-small text-ink-70 italic leading-relaxed">
            We&apos;re still decoding this bill into plain language. A clear read is on the way.
          </p>
        )}

        {/* Pills */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">
            {urgency.label}
          </span>
          {matchedLabel && (
            <span className="inline-block max-w-category truncate align-middle px-2.5 py-0.5 rounded-pill bg-ink-10 text-ink-70 text-meta">
              {matchedLabel}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between">
          <span className="text-meta text-ink-70 capitalize">{displayStatus.replace('_', ' ')}</span>
          <span className="inline-flex items-center gap-1 text-small font-medium text-ink">
            Take action
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}
