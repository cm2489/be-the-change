# STATUS — Be The Change

**Updated:** 2026-05-21 (afternoon)

## Last shipped
- Bill ingestion pipeline (Phase 3a, PR #4) — merged + smoke-tested green on prod.
- Time-based introduced status + vitest runner (PR #5) — merged, 8/8 unit tests passing.
- Branch-topology rule added to CLAUDE.md (PR #6) — merged.
- STATUS.md added (PR #7) — this file.
- Bill detail + BillCard canonical-schema fix + first happy-path Playwright spec (PR #8) — merged, spec passing.

## Branch state
main is current with origin. No open feature branches.

## Feature status (consumer MVP, 7 total)
1. Account + profile — built; missing email-verify gating + account-delete
2. Rep lookup — built (has test); confirm end-to-end once
3. Bill feed — mostly built; canonical-schema drift fixed + happy-path spec landed (PR #8); deriveDisplayStatus NOT yet wired (= Phase 3b)
4. AI call script — scaffold only; no script_generations table, no UI
5. 1-click calling — scaffold only; no call_events table, no UI
6. Web push — not started
7. Activity tracking — partial; needs 4 & 5 first

## Next action (single)
Phase 3b: wire deriveDisplayStatus into the feed surface so the 7-day
introduced-display window actually renders. (Pre-req Playwright spec
landed in PR #8.)

## Gate before Features 4/5/6
Author migrations for script_generations, call_events, push_subscriptions,
notifications_sent — confirm which already exist in 001/002/006 first.
