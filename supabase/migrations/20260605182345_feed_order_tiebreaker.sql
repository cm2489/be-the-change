-- ============================================================
-- 20260605182345_feed_order_tiebreaker.sql  (formerly 008_feed_order_tiebreaker.sql;
-- renamed 2026-06-06 to match prod's recorded version — see docs/solutions/migration-numbering.md)
-- ============================================================
--
-- Bug: get_default_feed and get_personalized_feed ORDER BY a non-unique
-- sort key (urgency_score / the relevance blend + last_action_date) with no
-- final unique tiebreaker. Postgres does not guarantee a stable order for
-- tied rows across separate OFFSET/LIMIT queries, so offset pagination (the
-- /bills "load more" feed) duplicates and skips rows wherever a tie group
-- straddles a page boundary -- on a fully static corpus (482 bills -> 183
-- distinct sort keys; largest tie group 83 rows).
--
-- Fix: append b.id (the unique PK) as the FINAL ORDER BY term in each
-- function, making the sort a total order. CREATE OR REPLACE rewrites each
-- function in full; the ONLY change vs migration 006 is the appended
-- tiebreaker line. Params, RETURNS, the CTEs, the WHERE EXISTS interest
-- match, the 0.4/0.6 relevance blend, LANGUAGE sql / STABLE / SECURITY
-- INVOKER, the pinned search_path, and every preceding sort term are
-- byte-for-byte identical to 006. No data, RLS, or grant change.
--
-- Alternative tiebreaker (Colby's choice): b.full_identifier is also unique
-- (the onConflict key, e.g. 'hr-1234-119') and is stable across DB reseeds;
-- it orders lexicographically rather than by random uuid. Default is b.id.

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
    s.last_action_date DESC NULLS LAST,
    s.id
  OFFSET p_offset
  LIMIT  p_limit;
$$;

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
    b.last_action_date DESC NULLS LAST,
    b.id
  OFFSET p_offset
  LIMIT  p_limit;
$$;
