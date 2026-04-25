-- 005_add_reps_last_refreshed_at.sql
-- Enforces the FEATURES.md rule: a user's rep set refreshes no more
-- than once per week unless they manually update their address.
-- Lives on profiles (one timestamp per user) rather than
-- user_representatives (per-rep) because the refresh is atomic across
-- the whole set — we re-derive all three reps from the same address.

ALTER TABLE profiles
  ADD COLUMN reps_last_refreshed_at timestamptz;

COMMENT ON COLUMN profiles.reps_last_refreshed_at IS
  'Last time this user''s federal reps were synced from Google Civic + Congress.gov. NULL = never synced. Server code should skip the external API calls if this is within the past 7 days, unless the address changed.';
