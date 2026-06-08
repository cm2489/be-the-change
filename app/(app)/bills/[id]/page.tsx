'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ScriptFlow } from '@/components/ScriptFlow'
import { CallFlow } from '@/components/CallFlow'
import { Skeleton } from '@/components/ui/skeleton'
import { urgencyLabel, formatDate, billIdentifier } from '@/lib/utils'
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

  // LOADING — skeleton mirroring the locked layout (contained max-w-2xl column,
  // quiet title, generous Decoded card). animate-pulse, neutral ink-10
  // placeholders; holds the shape so real content doesn't pop in / shift.
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" aria-hidden>
        <Skeleton className="mb-6 h-3 w-16" />
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-pill" />
          <Skeleton className="h-5 w-16 rounded-pill" />
        </div>
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-8 h-5 w-3/4" />
        <div className="mb-4 rounded-xl bg-paper-dark px-12 py-14">
          <Skeleton className="mx-auto mb-5 h-3 w-20" />
          <div className="mx-auto max-w-[65ch] space-y-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  // NOT FOUND — in-system empty state, no emoji. The "Not found" kicker echoes
  // the screen's editorial vocabulary; "Back to issues" is a neutral link.
  if (!bill) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-meta uppercase tracking-widest text-ink-70 mb-3">Not found</p>
        <p className="text-h3 text-ink mb-6">We couldn’t find that bill.</p>
        <Link href="/bills" className="text-small text-ink-70 underline underline-offset-2 hover:text-ink">
          Back to issues
        </Link>
      </div>
    )
  }

  const urgency = urgencyLabel(bill.urgency_score)
  const displaySummary = bill.ai_summary || bill.summary_text
  const identifier = billIdentifier(bill.bill_type, bill.bill_number)
  const relevance = resolveRelevance(userCategoryIds, bill.issue_tags)
  const lastActionDate = bill.last_action_date ? formatDate(bill.last_action_date) : null

  // CEILING-LOCKED — Direction D1+air (2026-06-01). Contained editorial reader's
  // column (max-w-2xl); neutrals only — color was fan-out-tested (signal orange,
  // a teal alt) and dropped, the accent did ~nothing here. See docs/DESIGN_DECISIONS.md.
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Back — neutral tokens. */}
      <button
        onClick={() => router.back()}
        className="text-small text-ink-70 hover:text-ink mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </button>

      {/* SLOT 1 — status bar · ring-outline neutral pills + mono citation id */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">{urgency.label}</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">Federal</span>
        <span className="font-mono text-meta text-ink-70 ml-1">{identifier}</span>
      </div>

      {/* SLOT 2 — official title · "Official title" kicker + serif-italic body at
          text-h3 / ink-50. Ceiling pass quieted it to a reference caption so the
          Decoded card leads; shown in FULL (no clamp — the official title is the
          legal object, never hidden behind a link). All on-token (no arbitrary
          values). <h1> is the page heading: hierarchy + the Feature 4/5 specs. */}
      <div className="mb-8">
        <p className="text-meta uppercase tracking-widest text-ink-70 mb-1.5">Official title</p>
        <h1 className="font-serif italic text-h3 text-ink-70 leading-relaxed">{bill.title}</h1>
      </div>

      {/* SLOT 3 — Decoded hero card. The page's centerpiece. "Floating warmth"
          surface (paper-dark + soft shadow, no border) with generous px-12 py-14
          padding ("air") so the translation breathes. Label + hairline always
          present; the body swaps filled (text-h3 / ink-85 / leading-loose) vs the
          empty reassurance line, both at the same ~65ch measure so the card holds
          its shape. Disclaimer (filled state only) is designed in, not bolted on.
          mb-4 so the relevance line (slot 4) hugs the card it explains. */}
      <div className="mb-4">
        <div className="bg-paper-dark shadow-md rounded-xl px-12 py-14">
          <div className="text-center mb-5">
            <p className="font-serif text-h2 text-ink">Decoded</p>
            <div className="mx-auto mt-3 h-px w-8 bg-divider-strong" />
          </div>
          {displaySummary ? (
            <p className="text-h3 text-ink-85 leading-loose max-w-[65ch] mx-auto">
              {displaySummary}
            </p>
          ) : (
            <p className="text-body text-ink-70 leading-relaxed max-w-[65ch] mx-auto">
              We’re still translating this bill into plain language. A clear read is on the way.
            </p>
          )}
          {displaySummary && (
            <p className="text-small italic text-ink-70 max-w-[65ch] mx-auto mt-5">
              AI-generated summary. May be incomplete or inaccurate; not an official source.
            </p>
          )}
        </div>
      </div>

      {/* SLOT 4 — RELEVANCE LINE. Quiet supporting line beneath the card. Neutrals
          only; matched area lifted with ink alone (ink-85). Three states from
          resolveRelevance(user categories ∩ bill.issue_tags) — see lib/relevance.ts. */}
      <div className="mb-8 text-small text-ink-70">
        {relevance.state === 'populated' && (
          <p>
            Touches your priorities:{' '}
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

      {/* SLOT 5 — METADATA ROW (labeled, stacked). Top divider rule; "Last action"
          meta-label + a neutral external "Full text" link on one row; the verbose
          last_action_text on its own full-width line below, clamped to one line. */}
      <div className="mb-10 border-t border-divider pt-4">
        <div className="flex items-baseline justify-between gap-6">
          <p className="text-meta uppercase tracking-widest text-ink-70">Last action</p>
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

      {/* SLOT 6 — CALL-SCRIPT SECTION (top rule + "Take action" kicker). Frames the
          shipped ScriptFlow/CallFlow cards as a deliberate section, pre-save (script
          only) and post-save (CallFlow on the scriptSaved gate). Internals off-limits;
          wiring is behavior-identical to the shipped Features 4 & 5. */}
      <div className="border-t border-divider pt-6">
        <p className="text-meta uppercase tracking-widest text-ink-70 mb-4">Take action</p>
        <div className="space-y-4">
          <ScriptFlow
            billId={bill.id}
            onSavedChange={(saved, id) => {
              setScriptSaved(saved)
              setScriptGenerationId(id)
            }}
          />
          {scriptSaved && (
            <CallFlow billId={bill.id} scriptGenerationId={scriptGenerationId} />
          )}
        </div>
      </div>

    </div>
  )
}
