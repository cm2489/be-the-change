# STATUS — Be The Change

**Updated:** 2026-05-21 (evening)

## Last shipped
- Bill ingestion pipeline (Phase 3a, PR #4) — merged + smoke-tested green on prod.
- Time-based introduced status + vitest runner (PR #5) — merged, 8/8 unit tests passing.
- Branch-topology rule added to CLAUDE.md (PR #6) — merged.
- STATUS.md added (PR #7) — this file.
- Bill detail + BillCard canonical-schema fix + first happy-path Playwright spec (PR #8) — merged, spec passing.
- STATUS.md refresh (PR #9) — merged.
- Docs-only gate skip codified in CLAUDE.md (PR #10) — merged.
- **Phase 3b: deriveDisplayStatus wired into BillCard + window-boundary Playwright spec (PR #11) — merged.**

## Branch state
main is current with origin. No open feature branches.

## Feature status (consumer MVP, 7 total)
1. Account + profile — built; missing email-verify gating + account-delete
2. Rep lookup — built (has test); confirm end-to-end once
3. Bill feed — built; canonical-schema fix landed (PR #8), deriveDisplayStatus wired (PR #11); 7-day display window covered by Playwright
4. AI call script — schema in place (`script_generations` exists in migration 002); `/api/scripts` route is broken against canonical schema and needs a rewrite; no UI yet
5. 1-click calling — schema in place (`call_events` exists in migration 002); `/api/calls` route is broken against canonical schema (writes to dropped `call_logs` — self-flagged in source); no UI yet
6. Web push — schema in place (`push_subscriptions`, `notifications_sent` exist in migration 002); no client-side subscription flow, no cron sender
7. Activity tracking — partial; needs 4 & 5 first

## Gate before Features 4/5/6 — CLEARED
Earlier STATUS framed this as "author migrations for script_generations,
call_events, push_subscriptions, notifications_sent." On inspection, all
four tables already exist in `002_align_to_schema.sql` with RLS matching
SCHEMA.md. The remaining gating work is API-route alignment, not schema:

- `/api/scripts/route.ts` writes to a non-existent `scripts` table with
  non-canonical columns; rewrite against `script_generations` keyed by
  `(user_id, bill_id, stance)` (the unique index is already there).
- `/api/calls/route.ts` writes to a dropped `call_logs` table; rewrite
  against `call_events` per SCHEMA.md. Already self-flagged in a header
  comment referencing `docs/deferred.md#schema-drift-call-logs-and-freemium`.

## Next action (single)
Feature 4 (AI call script) end-to-end: rewrite `/api/scripts` against
canonical `script_generations`, update `lib/anthropic.ts` to return
tokens + model for cost/audit persistence, build the stance picker +
editable-script UI on the bill detail page with the mandatory
"AI-drafted, review before use" disclaimer and "Save & Review" gate,
and cover the happy path with a Playwright spec.
