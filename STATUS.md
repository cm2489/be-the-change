# STATUS — Be The Change

**Updated:** 2026-05-23

## Last shipped
- **Feature 4: AI call script end-to-end (PR #13) — merged.**
- **Feature 5: 1-click calling end-to-end (PR #14) — merged.**
- STATUS refresh after Features 4 & 5 (PR #15) — merged.
- Dead `civic-*` classes → `ink` palette, 13 files (PR #16) — merged; `dead-civic-classes` RESOLVED.
- Landing stats: dropped out-of-scope "state & local" / "50 states" claims (PR #17) — merged.
- Email verification consciously deferred to pre-launch (PR #18) — merged.
- STATUS refresh (PR #19) — merged.
- `/project-context` loads STATUS.md first (PR #20) — merged.
- Anthropic cost docs corrected to prepaid balance / auto-reload off (PR #21) — merged.
- **Design system consolidation Batch 1 (PR #22) — merged.** `next/font` self-host + `Input`/`Card` primitives + `slate→token` / raw-size→type-scale / emoji→lucide sweep across 12 consumer surfaces (`slate-*` 192→3, raw sizes 131→46). Gate green throughout; screenshots verified 390 + desktop.

## Branch state
main current with origin. Open: `docs/status-refresh-after-batch1` (this refresh).

## Feature status (consumer MVP, 7 total)
1. Account + profile — built. **Email verification deferred to pre-launch** (Confirm-email is OFF → no real ownership check; BLOCK before public beta, `docs/deferred.md#email-verification-deferred`). Still missing account-delete (GDPR). Onboarding "skip for now" ungated (`docs/deferred.md#onboarding-skip-not-gated`).
2. Rep lookup — built (has test); confirm end-to-end once.
3. Bill feed — built; canonical-schema fix (PR #8), deriveDisplayStatus wired (PR #11); 7-day display window covered by Playwright.
4. AI call script — **done (PR #13).** Cache-first `/api/scripts` keyed by `(user_id, bill_id, stance)`; ScriptFlow UI; cost/token/hash audit; Playwright cache-hit spec. Rep-agnostic for now (`docs/deferred.md#feature-4-rep-personalization`).
5. 1-click calling — **done (PR #14).** `/api/calls` writes `call_events`; CallFlow on the bill detail page; Playwright full-loop + no-reps specs.
6. Web push — not started. Schema in place (`push_subscriptions`, `notifications_sent`); no client subscription flow, cron sender, or rate-limit/quiet-hours enforcement.
7. Activity tracking — **unblocked, not built.** `script_generations` + `call_events` both written, so the dashboard can surface bills followed / calls made / scripts generated.

**Design:** all 12 consumer surfaces consolidated onto the design system (Batch 1, PR #22). Brand identity still **unlocked** — wordmark, logo, landing hero, and how-bold-`signal`-gets are deliberately deferred; see the brand-lock items below.

## Next action (single)
**Bill-detail design work** (frontend design phase, fresh session) — design pass on the `/bills/[id]` surface (ScriptFlow + CallFlow live there). After that, **Feature 7 (activity tracking)** remains the next unbuilt feature: dashboard view over `followed_bills` / `call_events` / `script_generations`, personal-only (FEATURES.md).

## Open decisions / debt (see docs/deferred.md)
- `email-verification-deferred` — **BLOCK before public beta.** No ownership check (Confirm-email OFF). Paths: flip Confirm-email ON (~zero work) or custom Resend token flow. Gate-traps: `email-verified-at-dead-column`, `signup-check-email-dead-branch`.
- **Brand-lock (frontend design phase):** `type-scale-extension` (12px-non-uppercase / 18px-body / 20px / 30px gaps), `landing-features-grid-emoji` (6 emoji → lucide pending icon system), plus `brand-accent-color-pops` (wordmark/hero/stat accents).
- `consolidation-followup-offscope-slate-and-semantic-colors` — 31 `slate-*` in `bills/*` / `ImpactMetrics` / `RepCard` + off-palette red/green banners.
- `landing-copy-out-of-scope-features` — **SCOPE.** Landing still advertises state/local reps + "Callenge" gamification (out of MVP); reword before public/donor launch.
- `onboarding-skip-not-gated` — product decision on nudging incomplete-profile users.
- `untyped-browser-supabase-client` — `lib/supabase/client.ts` returns `null as any`; client queries unchecked at compile time (v1.1).
