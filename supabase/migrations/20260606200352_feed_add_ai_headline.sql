-- 20260606200352_feed_add_ai_headline.sql
-- Expose bills.ai_headline through both feed RPCs for the V4 bill-feed card.
--
-- ai_headline (added by 20260606152313_add_ai_headline) is the one-line
-- plain-language headline the V4 card leads with. The /bills feed reads bills
-- ONLY through these two RPCs, so the column must be in their return shape.
--
-- Why DROP + CREATE, not CREATE OR REPLACE: adding a column to a function's
-- RETURNS TABLE changes its return type, which CREATE OR REPLACE rejects
-- ("cannot change return type of existing function"). So each function is
-- dropped and recreated. This runs in the migration transaction, so the swap
-- is atomic — concurrent callers block on the function lock and see the new
-- definition after commit, never a gap. (Migration 008 only added an ORDER BY
-- term, not a column, which is why it could use CREATE OR REPLACE.)
--
-- The function bodies are byte-identical to the live definitions except for the
-- single added ai_headline column (RETURNS TABLE + SELECT). get_personalized_feed
-- keeps its existing matched_tags logic untouched; ai_headline is inserted
-- before matched_tags so both functions share the same column prefix.
--
-- EXECUTE grants (anon / authenticated / service_role) are re-applied to match
-- the prior ACL so PostgREST keeps exposing the RPCs (a fresh CREATE grants
-- PUBLIC EXECUTE by default, which already covers these roles via PUBLIC
-- membership; the explicit grants make the post-migration ACL match live exactly).

DROP FUNCTION IF EXISTS public.get_default_feed(integer, integer);
CREATE FUNCTION public.get_default_feed(p_offset integer, p_limit integer)
RETURNS TABLE(id uuid, full_identifier text, title text, ai_summary text, summary_text text, status text, last_action_text text, last_action_date date, introduced_date date, urgency_score numeric, issue_tags text[], congress_gov_url text, ai_headline text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
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
    b.ai_headline
  FROM bills b
  ORDER BY
    b.urgency_score DESC,
    b.last_action_date DESC NULLS LAST,
    b.id
  OFFSET p_offset
  LIMIT  p_limit;
$function$;
GRANT EXECUTE ON FUNCTION public.get_default_feed(integer, integer) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_personalized_feed(uuid, integer, integer);
CREATE FUNCTION public.get_personalized_feed(p_user_id uuid, p_offset integer, p_limit integer)
RETURNS TABLE(id uuid, full_identifier text, title text, ai_summary text, summary_text text, status text, last_action_text text, last_action_date date, introduced_date date, urgency_score numeric, issue_tags text[], congress_gov_url text, ai_headline text, matched_tags text[])
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
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
      b.ai_headline,
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
    s.ai_headline,
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
$function$;
GRANT EXECUTE ON FUNCTION public.get_personalized_feed(uuid, integer, integer) TO anon, authenticated, service_role;
