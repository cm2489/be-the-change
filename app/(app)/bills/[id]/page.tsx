'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ScriptFlow } from '@/components/ScriptFlow'
import { CallFlow } from '@/components/CallFlow'
import { urgencyLabel, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { resolveRelevance } from '@/lib/relevance'

interface Bill {
  id: string
  bill_number: number
  bill_type: string
  title: string
  summary_text: string | null
  ai_summary: string | null
  status: string
  last_action_text: string | null
  last_action_date: string | null
  urgency_score: number
  congress_gov_url: string | null
  issue_tags: string[] | null
}

// Format bill identifier as a Congress citation, e.g. "H.R. 4821" / "S. 1234".
function billIdentifier(billType: string, billNumber: number): string {
  const prefixes: Record<string, string> = {
    hr: 'H.R.',
    s: 'S.',
    hjres: 'H.J.Res.',
    sjres: 'S.J.Res.',
    hres: 'H.Res.',
    sres: 'S.Res.',
    hconres: 'H.Con.Res.',
    sconres: 'S.Con.Res.',
  }
  return `${prefixes[billType.toLowerCase()] ?? billType.toUpperCase()} ${billNumber}`
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  // Lifted from ScriptFlow so CallFlow can gate on a saved script and
  // thread the script_generations id into call_events.
  const [scriptSaved, setScriptSaved] = useState(false)
  const [scriptGenerationId, setScriptGenerationId] = useState<string | null>(null)
  const [userCategoryIds, setUserCategoryIds] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: billData } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single()

      if (billData) setBill(billData)

      // Relevance inputs: the user's selected top-level interest categories,
      // intersected with bill.issue_tags at render via resolveRelevance().
      const { data: interestRows } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', session.user.id)
      const interestCats = (interestRows ?? []) as Array<{ category: string }>
      setUserCategoryIds([...new Set(interestCats.map(r => r.category))])

      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading…
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-slate-500">Bill not found.</p>
        <Button className="mt-4" onClick={() => router.push('/bills')}>
          Back to issues
        </Button>
      </div>
    )
  }

  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary_text
  const identifier = billIdentifier(bill.bill_type, bill.bill_number)
  const relevance = resolveRelevance(userCategoryIds, bill.issue_tags)
  const lastActionDate = bill.last_action_date ? formatDate(bill.last_action_date) : null

  // FLOOR — Option A, bones pass. Outer vertical structure only: six labeled
  // slots so the stack order, proportions, and spacing rhythm are legible
  // before any slot is filled. No internals, no copy, no tokens yet.
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Back (kept as-is; restyled when we reach it) */}
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* SLOT 1 — status bar · ring-outline neutral pills + mono citation id */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">{urgency.label}</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">Federal</span>
        <span className="font-mono text-meta text-ink-50 ml-1">{identifier}</span>
      </div>

      {/* SLOT 2 — official title · sans "Official title" kicker (text-meta uppercase
          ink-50) + serif italic body (22px / font-medium / ink-70 / leading-relaxed /
          tracking 0.02em). LOCKED. Two arbitrary values used (22px, 0.02em) — both
          candidates for the type-scale-extension item in deferred.md. */}
      <div className="mb-8">
        <p className="text-meta uppercase tracking-widest text-ink-50 mb-1.5">Official title</p>
        <p className="font-serif italic font-medium text-[22px] text-ink-70 leading-relaxed tracking-[0.02em]">{bill.title}</p>
      </div>

      {/* SLOT 3 — Decoded hero card. LOCKED (surface + body + label + empty state).
          Card / label / rule are always present; only the body paragraph swaps:
          displaySummary → the Decoded body (sans / ink-85 / leading-loose); null
          (no summary synced yet) → the §4.6 empty state, a muted "Not decoded yet"
          line at the SAME ~65ch left measure so the card holds its shape between
          states. mb-4 so the relevance line (slot 4) hugs the card it explains. */}
      <div className="mb-4">
        <div className="bg-paper-dark shadow-md rounded-xl px-8 py-9">
          <div className="text-center mb-5">
            <p className="text-meta uppercase tracking-widest text-ink-70">Decoded</p>
            <div className="mx-auto mt-3 h-px w-8 bg-divider-strong" />
          </div>
          {displaySummary ? (
            <p className="text-body text-ink-85 leading-loose max-w-[65ch] mx-auto">
              {displaySummary}
            </p>
          ) : (
            <p className="text-body text-ink-50 max-w-[65ch] mx-auto">
              Not decoded yet — we’ll translate this bill into plain language shortly.
            </p>
          )}
        </div>
      </div>

      {/* SLOT 4 — RELEVANCE LINE. Quiet supporting line beneath the card, at the
          column's left edge (shares the card's left edge). Neutrals only;
          treatment C — the matched area is lifted with ink alone (ink-85, no
          extra weight); the empty-state link is a neutral underline. Three
          states from resolveRelevance(user categories ∩ bill.issue_tags) —
          parent-category match, see lib/relevance.ts. */}
      <div className="mb-8 text-small text-ink-50">
        {relevance.state === 'populated' && (
          <p>
            Touches your priorities —{' '}
            <span className="text-ink-85">
              {relevance.matchedCategories.map(c => c.label).join(', ')}
            </span>
          </p>
        )}
        {relevance.state === 'empty' && (
          <p>
            <Link
              href="/onboarding"
              className="underline underline-offset-2 text-ink-70 hover:text-ink"
            >
              Set your issue priorities
            </Link>{' '}
            to see why this matters to you.
          </p>
        )}
        {relevance.state === 'no_match' && (
          <p>This bill is outside your current priorities.</p>
        )}
      </div>

      {/* SLOT 5 — METADATA ROW. LOCKED (B — labeled, stacked). Top divider
          rule; "Last action" meta-label + a neutral external "Full text" link
          on one row; the verbose last_action_text on its own full-width line
          below, clamped to one line (metadata, not prose — brief §9). Tokens +
          neutrals; the link is neutral (underline/ink) — link color is ceiling. */}
      <div className="mb-10 border-t border-divider pt-4">
        <div className="flex items-baseline justify-between gap-6">
          <p className="text-meta uppercase tracking-widest text-ink-50">Last action</p>
          {bill.congress_gov_url && (
            <a
              href={bill.congress_gov_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-small text-ink-70 underline underline-offset-2 hover:text-ink"
            >
              Full text
            </a>
          )}
        </div>
        <p className="text-small text-ink-70 line-clamp-1 mt-1.5">
          {lastActionDate && <span>{lastActionDate} · </span>}
          {bill.last_action_text ?? 'No recorded action yet.'}
        </p>
      </div>

      {/* SLOT 6 — CALL-SCRIPT SECTION (shell only) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 h-3 w-28 rounded bg-slate-100" />
        <div className="h-28 rounded bg-slate-100" />
      </div>

    </div>
  )
}
