-- 002_align_to_schema.sql
-- Full schema reset to align with SCHEMA.md.
-- No user data to preserve (pre-MVP). Drops all old tables and recreates
-- from scratch with correct names, columns, constraints, RLS, and indexes.

-- ============================================================
-- TEARDOWN
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_personalized_feed(UUID, INT, INT);
DROP FUNCTION IF EXISTS get_default_feed(INT, INT);

DROP TABLE IF EXISTS callenge_participants CASCADE;
DROP TABLE IF EXISTS callenges          CASCADE;
DROP TABLE IF EXISTS user_interests     CASCADE;
DROP TABLE IF EXISTS rep_lookup_cache   CASCADE;
DROP TABLE IF EXISTS call_logs          CASCADE;
DROP TABLE IF EXISTS scripts            CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS bills              CASCADE;
DROP TABLE IF EXISTS representatives    CASCADE;
DROP TABLE IF EXISTS profiles           CASCADE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               text,
  email                   text,
  zip_code                text        CHECK (char_length(zip_code) = 5),
  full_address            text,
  district_ocd_id         text,
  "values"                text[],
  issue_priorities        text[],
  email_verified_at       timestamptz,
  onboarding_completed_at timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- REPRESENTATIVES
-- ============================================================
CREATE TABLE representatives (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bioguide_id     text NOT NULL UNIQUE,
  full_name       text NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  party           text NOT NULL,
  state           text NOT NULL CHECK (char_length(state) = 2),
  district        text,
  chamber         text NOT NULL CHECK (chamber IN ('house', 'senate')),
  dc_office_phone text NOT NULL,
  photo_url       text,
  website_url     text,
  term_start      date NOT NULL,
  term_end        date NOT NULL,
  last_synced_at  timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read"
  ON representatives FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_representatives_state   ON representatives(state);
CREATE INDEX idx_representatives_chamber ON representatives(chamber);

-- ============================================================
-- USER_REPRESENTATIVES
-- ============================================================
CREATE TABLE user_representatives (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  representative_id uuid NOT NULL REFERENCES representatives(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('house', 'senate_1', 'senate_2')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, relationship_type)
);

ALTER TABLE user_representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON user_representatives FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- BILLS
-- ============================================================
CREATE TABLE bills (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_number     int  NOT NULL,
  bill_type           text NOT NULL,
  bill_number         int  NOT NULL,
  full_identifier     text NOT NULL UNIQUE,
  title               text NOT NULL,
  short_title         text,
  summary_text        text,
  ai_summary          text,
  sponsor_bioguide_id text NOT NULL,
  introduced_date     date NOT NULL,
  last_action_date    date NOT NULL,
  last_action_text    text NOT NULL,
  status              text NOT NULL DEFAULT 'introduced',
  issue_tags          text[],
  congress_gov_url    text NOT NULL,
  last_synced_at      timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read"
  ON bills FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_bills_status          ON bills(status);
CREATE INDEX idx_bills_issue_tags      ON bills USING GIN(issue_tags);
CREATE INDEX idx_bills_last_action_date ON bills(last_action_date DESC);

-- ============================================================
-- BILL_ACTIONS
-- ============================================================
CREATE TABLE bill_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id     uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  action_date date NOT NULL,
  action_text text NOT NULL,
  action_type text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bill_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read"
  ON bill_actions FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FOLLOWED_BILLS
-- ============================================================
CREATE TABLE followed_bills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id    uuid NOT NULL REFERENCES bills(id)      ON DELETE CASCADE,
  stance     text CHECK (stance IN ('support', 'oppose', 'undecided')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bill_id)
);

ALTER TABLE followed_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON followed_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own" ON followed_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own" ON followed_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own" ON followed_bills FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SCRIPT_GENERATIONS
-- ============================================================
CREATE TABLE script_generations (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id       uuid         NOT NULL REFERENCES bills(id)      ON DELETE CASCADE,
  stance        text         NOT NULL CHECK (stance IN ('support', 'oppose', 'undecided')),
  script_text   text         NOT NULL,
  prompt_hash   text         NOT NULL,
  model         text         NOT NULL,
  input_tokens  int          NOT NULL,
  output_tokens int          NOT NULL,
  cost_usd      numeric(10,6) NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, bill_id, stance)
);

ALTER TABLE script_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON script_generations FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- CALL_EVENTS
-- ============================================================
CREATE TABLE call_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id)          ON DELETE CASCADE,
  bill_id              uuid NOT NULL REFERENCES bills(id)               ON DELETE CASCADE,
  representative_id    uuid NOT NULL REFERENCES representatives(id)     ON DELETE CASCADE,
  script_generation_id uuid          REFERENCES script_generations(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON call_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- PUSH_SUBSCRIPTIONS
-- ============================================================
CREATE TABLE push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text NOT NULL UNIQUE,
  p256dh_key text NOT NULL,
  auth_key   text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS_SENT
-- ============================================================
CREATE TABLE notifications_sent (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id           uuid          REFERENCES bills(id)      ON DELETE SET NULL,
  notification_type text NOT NULL,
  delivery_status   text NOT NULL CHECK (delivery_status IN (
    'sent', 'failed', 'blocked_by_rate_limit', 'blocked_by_quiet_hours'
  )),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON notifications_sent FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_sent_user_date
  ON notifications_sent(user_id, created_at DESC);
