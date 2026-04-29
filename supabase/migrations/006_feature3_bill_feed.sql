-- 006_feature3_bill_feed.sql
-- Feature 3 (Bill Feed) schema additions:
--   * bills.urgency_score   — stored, recomputed by cron each upsert
--   * bills.issue_analysis  — jsonb, lazily populated on first detail-page view
--   * sync_state            — single-row table for incremental cron high-water-mark
--   * indexes for urgency-sorted feed and relevance intersection
--   * get_personalized_feed / get_default_feed RPCs (replacing the pair dropped in 002)
--
-- Decisions logged in STRATEGY.md §11 (entries dated 2026-04-28).

-- ============================================================
-- BILLS — new columns
-- ============================================================
--
-- urgency_score is computed in code on each upsert from the bill's
-- status + last_action_date recency (see SCHEMA.md → urgency_score
-- formula). The CHECK constraint enforces the [0.000, 1.000] range
-- since numeric(4,3) by itself permits values up to 9.999.
--
-- TODO (calibration): the status weights and the recency-bonus values
-- (and `vetoed = 0.30`) were chosen by reasoning, not by fitting
-- against real bill data. See Phase 2 end-of-phase report —
-- "Three Questions / least confident". Revisit after the Phase 3
-- backfill populates the feed and beta testers scan it for ordering
-- that feels obviously wrong. v1.1 polish, not Phase 3.
--
-- issue_analysis is generated lazily by the bill-detail page on first
-- view (Phase 4) and never bulk-backfilled. Shape documented in
-- SCHEMA.md.

ALTER TABLE bills
  ADD COLUMN urgency_score numeric(4,3) NOT NULL DEFAULT 0
    CHECK (urgency_score >= 0 AND urgency_score <= 1);

ALTER TABLE bills
  ADD COLUMN issue_analysis jsonb;

-- ============================================================
-- BILLS — indexes for Feature 3 feed queries
-- ============================================================

CREATE INDEX idx_bills_urgency_score
  ON bills (urgency_score DESC, last_action_date DESC);

CREATE INDEX idx_bills_introduced_date
  ON bills (introduced_date DESC);

-- ============================================================
-- USER_INTERESTS — index for relevance intersection
-- ============================================================

CREATE INDEX idx_user_interests_user_category
  ON user_interests (user_id, category);

-- ============================================================
-- SYNC_STATE — single-row cron high-water-mark + diagnostics
-- ============================================================
--
-- Tracks the latest successful incremental sync timestamp so the cron
-- can pass `fromDateTime` to Congress.gov and pick up only bills
-- updated since the prior run (with a 48-hour overlap, applied in
-- code).
--
-- last_sync_status + last_sync_error give an in-DB signal when the
-- cron starts failing silently. The cron writes these on every run
-- (success, partial, failed) so we can surface drift via SQL rather
-- than only via Vercel logs — that's the recurrence we're trying to
-- prevent (see schema-drift-sync-bills in docs/deferred.md).
--
-- Single-row enforcement: a unique index on the constant expression
-- `(1)` — every row has the same value, so only one row can satisfy
-- the unique constraint. Service-role-only writes; no SELECT policy
-- for authenticated users since they have no need for sync metadata.

CREATE TABLE sync_state (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  last_successful_sync_at  timestamptz,
  last_sync_status         text        CHECK (last_sync_status IN ('success', 'partial', 'failed')),
  last_sync_error          text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sync_state_singleton ON sync_state ((1));

ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
-- DO NOT add a SELECT policy without also restricting INSERT/UPDATE/DELETE
-- explicitly. RLS-enabled-with-no-policies denies all authenticated access.
-- Adding any single permissive policy without writing matching restrictive
-- policies for other operations may inadvertently open writes.

-- ============================================================
-- RPC: get_personalized_feed
-- ============================================================
--
-- Personalized bill feed for users with at least one user_interests
-- row. Joins bills against the user's selected categories, intersects
-- with bills.issue_tags (which contains both subcategory ids and
-- their parent-category ids per the bill-tagger refactor in this
-- branch), and returns each matching bill with the matched-tag set
-- the relevance badge renders from.
--
-- Composite sort key, both components in [0, 1]:
--   relevance_ratio = cardinality(matched_tags) / user_cat_count
--   composite       = COALESCE(relevance_ratio, 0) * 0.4
--                   + urgency_score                * 0.6
--
-- The relevance term is normalized by the user's total category count
-- so a stale omnibus bill that touches every interest doesn't outrank
-- an urgent single-issue bill on relevance alone. The 0.4/0.6 weights
-- now meaningfully describe a tradeoff rather than competing on
-- different scales. NULLIF guards a div-by-zero that shouldn't occur
-- (this RPC is only called when the user has interests) but is
-- defensive against future callers.
--
-- SECURITY INVOKER: function executes under the caller's RLS. bills
-- has an authenticated_can_read policy; user_interests is scoped to
-- auth.uid() = user_id. Caller can only read their own interests
-- and any bill row — exactly what we want.
--
-- search_path is pinned to public to mirror the search-path hardening
-- pattern from migration 004 (handle_new_user trigger).

CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id uuid,
  p_offset  int,
  p_limit   int
) RETURNS TABLE (
  id                uuid,
  full_identifier   text,
  title             text,
  ai_summary        text,
  summary_text      text,
  status            text,
  last_action_text  text,
  last_action_date  date,
  introduced_date   date,
  urgency_score     numeric,
  issue_tags        text[],
  congress_gov_url  text,
  matched_tags      text[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH user_cats AS (
    SELECT DISTINCT category
    FROM user_interests
    WHERE user_id = p_user_id
  ),
  scored AS (
    SELECT
      b.id,
      b.full_identifier,
      b.title,
      b.ai_summary,
      b.summary_text,
      b.status,
      b.last_action_text,
      b.last_action_date,
      b.introduced_date,
      b.urgency_score,
      b.issue_tags,
      b.congress_gov_url,
      ARRAY(
        SELECT DISTINCT tag
        FROM unnest(b.issue_tags) AS tag
        WHERE tag IN (SELECT category FROM user_cats)
      ) AS matched_tags
    FROM bills b
    WHERE EXISTS (
      SELECT 1
      FROM user_cats uc
      WHERE uc.category = ANY(b.issue_tags)
    )
  )
  SELECT
    s.id,
    s.full_identifier,
    s.title,
    s.ai_summary,
    s.summary_text,
    s.status,
    s.last_action_text,
    s.last_action_date,
    s.introduced_date,
    s.urgency_score,
    s.issue_tags,
    s.congress_gov_url,
    s.matched_tags
  FROM scored s
  ORDER BY
    (
      COALESCE(
        cardinality(s.matched_tags)::numeric
          / NULLIF((SELECT count(*) FROM user_cats), 0),
        0
      ) * 0.4
      + s.urgency_score * 0.6
    ) DESC,
    s.last_action_date DESC NULLS LAST
  OFFSET p_offset
  LIMIT  p_limit;
$$;

-- ============================================================
-- RPC: get_default_feed
-- ============================================================
--
-- Default bill feed for users with empty user_interests. Pure
-- urgency + recency sort, no relevance badge column. Renders behind
-- a banner that nudges the user back to /onboarding.

CREATE OR REPLACE FUNCTION get_default_feed(
  p_offset int,
  p_limit  int
) RETURNS TABLE (
  id                uuid,
  full_identifier   text,
  title             text,
  ai_summary        text,
  summary_text      text,
  status            text,
  last_action_text  text,
  last_action_date  date,
  introduced_date   date,
  urgency_score     numeric,
  issue_tags        text[],
  congress_gov_url  text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.full_identifier,
    b.title,
    b.ai_summary,
    b.summary_text,
    b.status,
    b.last_action_text,
    b.last_action_date,
    b.introduced_date,
    b.urgency_score,
    b.issue_tags,
    b.congress_gov_url
  FROM bills b
  ORDER BY
    b.urgency_score DESC,
    b.last_action_date DESC NULLS LAST
  OFFSET p_offset
  LIMIT  p_limit;
$$;
