-- 20260603133555_crs_reanchor.sql  (formerly 007_crs_reanchor.sql; renamed 2026-06-06 to
-- match the timestamp version the MCP apply_migration path recorded in prod — see
-- docs/solutions/migration-numbering.md for the one-time exception.)
-- Re-anchor the interest taxonomy on CRS Policy Areas.
-- Decision + evidence: docs/deferred.md#taxonomy-crs-reassess.
--
--   * bills.policy_area  — capture Congress.gov's CRS Policy Area
--                          (bill.policyArea.name), previously discarded at
--                          sync time. Drives the new 1:1 issue_tags derivation
--                          (lib/bill-tagger.ts).
--   * WIPE user_interests — pre-launch, intentional reset to the new flat
--                           12-category vocabulary.
--
-- The feed RPCs (get_personalized_feed / get_default_feed from 006) are
-- UNCHANGED: they intersect on whatever ids live in user_interests.category
-- and bills.issue_tags, so the re-anchor happens in data + lib/interests.ts,
-- not in SQL.

-- ============================================================
-- BILLS — capture CRS Policy Area
-- ============================================================
-- Nullable: ~0.6% of bills (3/482 at re-anchor time) have no Policy Area in
-- the Congress.gov response; those fall back to keyword tagging in code.
-- Stored as provenance/diagnostics — the feed reads issue_tags, not this.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS policy_area text;

-- ============================================================
-- USER_INTERESTS — destructive pre-launch reset
-- ============================================================
-- 🔴 DESTRUCTIVE, INTENTIONAL. Existing rows reference the OLD
-- 10-category / 34-subcategory ids (env_*, hc_*, …) which no longer exist in
-- lib/interests.ts, so they can never intersect the new flat category ids the
-- re-tagged bills carry. Pre-launch: no production users to preserve;
-- interests are re-collected on next onboarding under the new vocabulary.
--
-- The `subcategory` column is intentionally KEPT (now always NULL going
-- forward). The UNIQUE NULLS NOT DISTINCT (user_id, category, subcategory)
-- constraint from 003 then behaves as "one row per (user, category)" — exactly
-- what flat categories want. Dropping the column is an optional later cleanup,
-- not worth a destructive DDL here.

-- 🛡️ REPLAY GUARD (added 2026-06-06 — see docs/deferred.md#migration-history-version-mismatch).
-- The original bare `DELETE FROM user_interests` here was a one-time pre-launch reset.
-- Re-running it — a fresh `supabase db reset`, or any accidental re-application — would
-- re-wipe real users' saved interests. The guard scopes the delete to rows whose `category`
-- is NOT in the current flat CRS-anchored vocabulary (the 12 ids in lib/interests.ts).
-- Original first-run behavior is unchanged: at the pre-launch reset every row referenced an
-- OLD env_*/hc_* id (none of these), so all rows were deleted exactly as before. On any
-- REPLAY against live data, real rows carry the new flat ids and are preserved — the
-- statement becomes a no-op. (This file was renamed to its recorded timestamp version so a
-- `supabase db push` no longer treats it as pending; this guard remains as defense-in-depth
-- for fresh replays. If the taxonomy is ever re-cut, keep this list in sync.)
DELETE FROM user_interests
WHERE category <> ALL (ARRAY[
  'jobs_economy', 'ai_technology', 'health', 'housing', 'immigration',
  'government_democracy', 'crime_justice', 'education', 'environment_energy',
  'rights_liberties', 'national_security', 'family_community'
]);
