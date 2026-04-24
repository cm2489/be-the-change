-- 003_user_interests.sql
-- Adds user_interests table used by onboarding, settings, bill feed, and script generation.
-- Fixes missing RLS INSERT policy on call_events from 002.
-- Backfills profiles for auth users who existed before 002's DROP TABLE CASCADE.

-- ============================================================
-- USER_INTERESTS
-- ============================================================
CREATE TABLE user_interests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text NOT NULL,
  subcategory text,
  rank        int  NOT NULL DEFAULT 50 CHECK (rank BETWEEN 1 AND 99),
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT: treats (user_id, category, NULL) as a unique combination
  -- so a category-only row (no subcategory) can't be inserted twice.
  UNIQUE NULLS NOT DISTINCT (user_id, category, subcategory)
);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own"
  ON user_interests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MISSING RLS POLICY FROM 002
-- ============================================================

-- call_events only had SELECT; users need INSERT to log calls.
-- DELETE is intentionally omitted: call_events is append-only (audit log).
-- Account deletion cascades via ON DELETE CASCADE on user_id if full removal is needed.
CREATE POLICY "users_insert_own"
  ON call_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- BACKFILL
-- ============================================================
-- Profiles for users created before migration 002 ran DROP TABLE CASCADE.
-- The trigger handles new signups; this covers the orphaned existing accounts.
INSERT INTO profiles (user_id, email)
SELECT id, email FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = u.id
);
