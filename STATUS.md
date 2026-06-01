# STATUS — Oravan

**Updated:** 2026-06-01

## Last shipped
- **Process guardrails (PR #36) — merged.** Two scope-creep rules added to `CLAUDE.md → Hard "Do Not Do" Rules`: (1) no jumping ahead in a gated/multi-step task — finish each step and wait for sign-off; (2) no unrequested scope — no "while I'm here" extras, and when told to stop a behavior, stop and make the change directly. Repo side of a tooling/housekeeping pass that also added a global `/pr` skill and a global execution-transparency rule (both live in `~/.claude/`, outside this repo). Docs-only. **Not done this session: GitHub MCP** — deferred as its own next step.
- **Bill-detail ceiling (PR #34) — merged.** Ceiling design pass on `/bills/[id]`, locking the flagship as a **calm neutral editorial article**: contained `max-w-2xl` reader's column, the "Decoded" hero card given generous `px-12 py-14` air, official title quieted to a `text-h3`/`ink-50` reference caption (full, no clamp — the title is the legal object). One motivated rule-break (via the **creative-director** skill): the hero's label is a **serif "Decoded" at display scale** (`text-h2`) — the signature Instrument Serif carrying the hero. **No accent color** — fan-out-tested (signal orange + a teal alt) and dropped; color earned nothing. AI-summary **disclaimer designed into the card**. Every decision (incl. what was tested + rejected) recorded in `docs/DESIGN_DECISIONS.md → Ceiling pass — LOCKED`. lint + build + bill-detail Playwright green.
- **AI-summary pre-warm (PR #31) — merged.** `scripts/prewarm-bills.ts` generates plain-language Decoded summaries from each bill's **full text** (Congress.gov `/text`, Sonnet) for a curated ~20-bill sample, written straight to `bills.ai_summary`. Ran once: **19/19 written, ~$0.34.** A design/demo accelerant — NOT the production pipeline. Doc follow-ups: PRs #30/#32/#33 (migration-integrity note, prewarm follow-ups, summary-prompt length constraint).
- **Bill-detail floor (PR #29) — merged.** The floor pass the ceiling built on (slots, every state, neutral hierarchy on tokens).
- Earlier: Design Batch 1 (PR #22); Features 4 & 5 (PRs #13/#14); fixes #15–#21.

## 🚩 Flagged — production summary pipeline still deferred
The Decoded hero now renders **real plain-language translations on the ~20 pre-warmed bills** (demoable). But: (1) the other ~461/482 bills still show the warm empty state (`ai_summary` null); (2) the **real lazy-on-view / sync-time summary pipeline was never built** (verified this session — `ai_summary` is read everywhere, written only by the pre-warm script); (3) **summary accuracy is unverified** — the 3 truncated bills (`hr-1`/`s-1776`/`s-3923`) were summarized from a capped text slice and need a spot-check against Congress.gov. Demoable on the curated set; **before a broad demo or public launch**, backfill more bills (or build the real cache-first pipeline) and spot-check accuracy. Tracked: `docs/deferred.md#feature-3-prewarm-demo-bills`.

## Branch state
`main` current with origin at the **#36** merge. `docs/claude-md-scope-rules` merged + pruned (local branch + stale remote-tracking ref). Note: GitHub auto-deletes head branches on merge, so the remote ref was already gone — `git push origin --delete` errored, only the local tracking ref needed dropping. Earlier session branches (#34/#35 and prior) already merged + pruned.

## Feature status (consumer MVP, 7 total)
1. Account + profile — built. **Email verification deferred to pre-launch** (Confirm-email OFF → no ownership check; BLOCK before public beta, `docs/deferred.md#email-verification-deferred`). Still missing account-delete (GDPR); onboarding "skip" ungated.
2. Rep lookup — built (has test); confirm end-to-end once.
3. Bill feed — built. `/bills/[id]` is now **floor + ceiling complete** (PR #34). ⚠ Relevance is undercut by the `issue_tags` coverage gap (below).
4. AI call script — **done (PR #13).** `ai_summary`: pre-warmed for a ~20-bill sample (PR #31); the production lazy/sync generation is **still deferred** (see flag).
5. 1-click calling — **done (PR #14).** `/api/calls` writes `call_events`; CallFlow; full-loop + no-reps specs.
6. Web push — not started. Schema in place (`push_subscriptions`, `notifications_sent`); no client flow, cron sender, or rate-limit/quiet-hours.
7. Activity tracking — **unblocked, not built.** Dashboard over `followed_bills` / `call_events` / `script_generations`, personal-only.

**Design:** `/bills/[id]` is **floor + ceiling complete** — locked as a neutral editorial article (serif "Decoded" hero, no accent, contained column, disclaimer), recorded in `docs/DESIGN_DECISIONS.md`. **Next design step: propagate this vocabulary to the feed + dashboard** (the playbook's "one screen to a high bar, then propagate"). Brand identity (wordmark, logo, landing hero) still **unlocked**.

## Next action (single)
**The backend / data-quality session** (reserved): (a) **`issue_tags` coverage diagnosis** — 377/482 bills (~78%) are untagged, so the values-based relevance feed silently under-delivers on most content (`docs/deferred.md#feature-3-issue-tags-coverage-gap`); (b) **summary-accuracy spot-check** of the pre-warmed bills against Congress.gov (esp. the 3 truncated). The `email-verification` BLOCK is the other pre-launch must. Alternatives: **propagate the design vocabulary** to feed/dashboard, or build **Feature 7 (activity tracking)**.

## Open decisions / debt (see docs/deferred.md)
- **`feature-3-issue-tags-coverage-gap` (NEW, this session)** — 377/482 untagged; the relevance feed (the product's core differentiator) silently under-delivers on ~78% of bills. Diagnose before any donor demo (a diagnosis query first, not a code change).
- **Summary accuracy + production pipeline** — see the flag; `feature-3-prewarm-demo-bills` (pre-warm built; real cache-first pipeline + broad backfill deferred; accuracy spot-check owed).
- `email-verification-deferred` — **BLOCK before public beta.** Flip Confirm-email ON (~zero work) or a custom Resend token flow.
- **`ai-disclaimer-decoded-hero` — RESOLVED (PR #34):** disclaimer shipped in the Decoded card.
- **Design / brand:** bill-detail ceiling **done** (no-accent locked; serif hero); the title's arbitrary type values **resolved** (on-token). Remaining: propagate to feed/dashboard; `type-scale-extension` (20/30px + non-uppercase-12px caption gaps on other surfaces — tokens-only, resolve as surfaces are touched); `landing-features-grid-emoji`; brand identity (wordmark/logo/landing hero) unlocked.
- `consolidation-followup-offscope-slate-and-semantic-colors` — remaining: `bills/page.tsx` (feed), `ImpactMetrics`, `RepCard` + off-palette red/green banners.
- `landing-copy-out-of-scope-features` — **SCOPE.** Landing still advertises state/local reps + the "Callenge" gamification (out of MVP); reword + drop the nav item before public/donor launch.
- `onboarding-skip-not-gated` — product decision on nudging incomplete-profile users.
- `untyped-browser-supabase-client` — `lib/supabase/client.ts` returns `null as any`; client queries unchecked at compile time (v1.1).
