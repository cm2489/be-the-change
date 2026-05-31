# STATUS — Oravan

**Updated:** 2026-05-31

## Last shipped
- **Bill-detail floor (PR #29) — merged.** Floor-level design pass on `/bills/[id]`: plain-language "Decoded" hero (warm `paper-dark` card), serif-italic `<h1>` official title, 3-state relevance line, labeled metadata row, and a "Take action" section framing the shipped ScriptFlow/CallFlow (internals untouched). Every state designed: loading skeleton, text-only not-found, Decoded-empty (warm, neutral), relevance populated/empty/no-match. Added `lib/relevance.ts` + a regression test pinning the parent-only matching semantics (guards the prior tagger bug); `docs/DESIGN_DECISIONS.md` (every locked choice + exact classes); a Design Workflow pointer in `CLAUDE.md`; moved the playbook to `docs/DESIGN_PLAYBOOK.md`. Full Playwright suite 6/6 green; co-designed slot-by-slot, screenshot-verified at 390 + desktop.
- **Design system consolidation Batch 1 (PR #22) — merged.** `next/font` self-host + `Input`/`Card` primitives + `slate→token` / raw-size→type-scale / emoji→lucide sweep across 12 consumer surfaces.
- Features 4 & 5 end-to-end (PRs #13, #14); Batch-1-era refreshes and fixes (PRs #15–#21).

## 🚩 Flagged — summarization not wired (blocks the flagship's value)
**The "Decoded" hero renders EMPTY on all 482 real bills.** `bills.summary_text` and `ai_summary` are both null across the board: the Feature 4 lazy AI-summary generation isn't producing summaries, and Congress.gov `summary_text` comes back null on synced bills. The floor handles this gracefully (the warm empty state), but the plain-language translation — the screen's whole point and the donor-demo "wow" — is absent in production. **Before any donor demo, pre-warm summaries (script tracked in `docs/deferred.md`) or wire/trigger the Feature 4 generation.** Verify against real data, never a seeded fixture. (Discovered capturing pre-merge visuals for the floor, 2026-05-31.)

## Branch state
`main` current with origin, includes the merged floor (PR #29, merge commit). `feat/bill-detail-floor` merged and pruned (local + remote).

## Feature status (consumer MVP, 7 total)
1. Account + profile — built. **Email verification deferred to pre-launch** (Confirm-email OFF → no real ownership check; BLOCK before public beta, `docs/deferred.md#email-verification-deferred`). Still missing account-delete (GDPR). Onboarding "skip for now" ungated.
2. Rep lookup — built (has test); confirm end-to-end once.
3. Bill feed — built. The bill **detail** screen `/bills/[id]` is now **floor-complete** (PR #29).
4. AI call script — **done (PR #13).** Cache-first `/api/scripts` keyed by `(user_id, bill_id, stance)`; ScriptFlow UI; cost/token/hash audit; cache-hit spec. ⚠ See the summarization flag: the lazy `ai_summary` generation isn't producing summaries, so the Decoded hero is empty in prod.
5. 1-click calling — **done (PR #14).** `/api/calls` writes `call_events`; CallFlow; full-loop + no-reps specs.
6. Web push — not started. Schema in place (`push_subscriptions`, `notifications_sent`); no client subscription flow, cron sender, or rate-limit/quiet-hours.
7. Activity tracking — **unblocked, not built.** Dashboard over `followed_bills` / `call_events` / `script_generations`, personal-only (FEATURES.md).

**Design:** `/bills/[id]` is **floor-complete** (structure/hierarchy/neutrals/states on tokens; color deferred). **Ceiling pass is the next design step:** color and how-bold-`signal`-gets, with the Decoded-weight-vs-long-titles rebalance queued as the opening input (`docs/DESIGN_DECISIONS.md → Ceiling inputs`). Then propagate the floor's patterns to the feed/dashboard. Brand identity (wordmark, logo, landing hero) still **unlocked**.

## Next action (single)
**Make the Decoded hero real** — pre-warm summaries (`docs/deferred.md`) or wire the Feature 4 lazy generation, so the flagship screen's translation actually renders (see the summarization flag). Highest-leverage step toward a demo-worthy MVP. Alternatives once that's moving: the **ceiling pass** (color on bill-detail), or the next unbuilt feature — **Feature 7 (activity tracking)**.

## Open decisions / debt (see docs/deferred.md)
- **`summarization-not-wired` (FLAGGED, see above)** — Decoded hero empty on all real bills; pre-warm or wire Feature 4 generation before any demo.
- `email-verification-deferred` — **BLOCK before public beta.** No ownership check (Confirm-email OFF). Flip Confirm-email ON (~zero work) or a custom Resend token flow.
- **Ceiling pass / brand:** Decoded-weight-vs-long-titles (first ceiling input, `DESIGN_DECISIONS.md`); `brand-accent-color-pops`; `type-scale-extension` (the bill-detail title uses arbitrary `text-[22px]` / `tracking-[0.02em]` pending a formalize-or-one-off call); `landing-features-grid-emoji`.
- `consolidation-followup-offscope-slate-and-semantic-colors` — `/bills/[id]` slate resolved by the floor; remaining: `bills/page.tsx` (feed), `ImpactMetrics`, `RepCard` + off-palette red/green banners.
- `landing-copy-out-of-scope-features` — **SCOPE.** Landing still advertises state/local reps + the "Callenge" gamification (out of MVP); reword and drop the nav item before public/donor launch.
- `onboarding-skip-not-gated` — product decision on nudging incomplete-profile users.
- `untyped-browser-supabase-client` — `lib/supabase/client.ts` returns `null as any`; client queries unchecked at compile time (v1.1).
