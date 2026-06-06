-- 20260606152313_add_ai_headline.sql  (formerly 009_add_ai_headline.sql; renamed 2026-06-06
-- to match prod's recorded version — see docs/solutions/migration-numbering.md)
-- Adds the generated feed-card headline column for the V4 bill-feed card
-- (spec: docs/DESIGN_DECISIONS.md → "Bill feed card (V4)";
--  tracking: docs/deferred.md#feed-card-v4-build).
--
-- ONE short editorial headline per bill, generated FROM bills.ai_summary
-- (NOT the full bill text): "Topic Label — Action", Title Case, strictly
-- non-partisan, <=90 chars, naming the specific agency/rule so near-identical
-- CRA disapproval bills get distinct headlines. Distinct from ai_summary
-- (the plain-language paragraph): ai_headline is the single line the V4 card
-- leads with.
--
-- Nullable: a bill with no ai_summary has no headline, and the steady-state
-- generation pipeline is a SEPARATE later build (no sync-time generation
-- exists today — see docs/deferred.md#steady-state-summarize-cron). Backfilled
-- one-off by scripts/backfill-headlines.ts.

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS ai_headline text;

COMMENT ON COLUMN bills.ai_headline IS
  'LLM-generated one-line feed-card headline, derived FROM ai_summary (not bill text): "Topic Label — Action", Title Case, non-partisan, <=90 chars. NULL when ai_summary is NULL or not yet generated. One-off backfill: scripts/backfill-headlines.ts; no steady-state pipeline yet (docs/deferred.md#feed-card-v4-build).';
