-- 007_crs_reanchor.sql
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

ALTER TABLE bills ADD COLUMN policy_area text;

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

DELETE FROM user_interests;
