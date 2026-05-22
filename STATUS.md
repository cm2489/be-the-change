# STATUS — Be The Change

**Updated:** 2026-05-22

## Last shipped
- Bill ingestion pipeline (Phase 3a, PR #4) — merged + smoke-tested green on prod.
- Time-based introduced status + vitest runner (PR #5) — merged, 8/8 unit tests passing.
- Branch-topology rule added to CLAUDE.md (PR #6) — merged.
- STATUS.md added (PR #7) — this file.
- Bill detail + BillCard canonical-schema fix + first happy-path Playwright spec (PR #8) — merged.
- STATUS.md refresh (PR #9) — merged.
- Docs-only gate skip codified in CLAUDE.md (PR #10) — merged.
- Phase 3b: deriveDisplayStatus wired into BillCard + window-boundary spec (PR #11) — merged.
- STATUS refresh; migration gate confirmed cleared (PR #12) — merged.
- **Feature 4: AI call script end-to-end (PR #13) — merged.**
- **Feature 5: 1-click calling end-to-end (PR #14) — merged.**
- STATUS refresh after Features 4 & 5 (PR #15) — merged.
- Dead `civic-*` classes → `ink` palette, 13 files (PR #16) — merged; `dead-civic-classes` RESOLVED.
- Landing stats: dropped out-of-scope "state & local" / "50 states" claims (PR #17) — merged.
- Email verification consciously deferred to pre-launch — docs-only (`docs/email-verification-deferred`, PR open). See Feature 1 + Open decisions.

## Branch state
main current with origin. Open: `docs/email-verification-deferred` (docs, PR open), `docs/refresh-status` (this refresh).

## Feature status (consumer MVP, 7 total)
1. Account + profile — built. **Email verification deferred to pre-launch** (decision 2026-05-22): Supabase "Confirm email" is OFF, so `auth.users.email_confirmed_at` is true-for-everyone (proves nothing) and `profiles.email_verified_at` is true-for-no-one — no real proof-of-ownership exists anywhere. BLOCK before any public beta (`docs/deferred.md#email-verification-deferred`). Still missing account-delete (GDPR). Onboarding "skip for now" lets users in with no address/reps and isn't gated (`docs/deferred.md#onboarding-skip-not-gated`).
2. Rep lookup — built (has test); confirm end-to-end once.
3. Bill feed — built; canonical-schema fix (PR #8), deriveDisplayStatus wired (PR #11); 7-day display window covered by Playwright.
4. AI call script — **done (PR #13).** Cache-first `/api/scripts` keyed by `(user_id, bill_id, stance)`; ScriptFlow UI (stance picker → generate → editable textarea + "AI-drafted" disclaimer → Save & Review); cost/token/hash audit persisted; Playwright cache-hit spec. Scripts are rep-agnostic for now (`docs/deferred.md#feature-4-rep-personalization`).
5. 1-click calling — **done (PR #14).** `/api/calls` writes `call_events`; CallFlow on the bill detail page (tap-to-call `tel:` / copy number / self-report confirm), address-aware empty state with a validated `?return=` round-trip; Playwright full-loop + no-reps specs.
6. Web push — not started. Schema in place (`push_subscriptions`, `notifications_sent` in migration 002); no client-side subscription flow, no cron sender, no rate-limit/quiet-hours enforcement.
7. Activity tracking — **unblocked, not built.** `script_generations` and `call_events` are both written, so the dashboard can surface bills followed / calls made / scripts generated.

## Next action (single)
Feature 7 (activity tracking): build the dashboard view that queries
`followed_bills`, `call_events`, and `script_generations` for the signed-in
user and renders personal stats + a call log with timestamps and which
bill/rep each was for. Purely personal — no social/sharing (FEATURES.md).

## Open decisions / debt (see docs/deferred.md)
- `email-verification-deferred` — **BLOCK before public beta.** No email
  ownership check exists today (Confirm-email OFF). Two teed-up paths: flip
  Confirm-email ON (native, ~zero work) or a custom Resend token flow. Two
  related gate-traps logged alongside it: `email-verified-at-dead-column`
  (looks gate-able but 403s everyone) and `signup-check-email-dead-branch`
  (unreachable UI under auto-confirm).
- `onboarding-skip-not-gated` — product decision: should feed/script/call
  surfaces nudge incomplete-profile users, or should onboarding be soft-gated?
  Each surface currently handles it differently.
- `untyped-browser-supabase-client` — `lib/supabase/client.ts` returns
  `null as any`, so every client-side query is unchecked at compile time.
  v1.1 type-safety pass.
