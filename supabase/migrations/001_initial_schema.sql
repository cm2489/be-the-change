-- Be The Change — Initial Schema Migration
-- Run this in the Supabase SQL editor or via Supabase CLI

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  zip_code TEXT,
  state_code CHAR(2),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  calls_today INTEGER DEFAULT 0,
  calls_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- USER INTERESTS (2-level: category + optional subcategory)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  rank INTEGER DEFAULT 50 CHECK (rank BETWEEN 1 AND 99),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, subcategory)
);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interests"
  ON user_interests FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- REPRESENTATIVES (cached from Google Civic API)
-- ============================================================
CREATE TABLE IF NOT EXISTS representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
  party TEXT,
  state_code CHAR(2),
  zip_codes TEXT[],
  phone TEXT,
  email TEXT,
  website_url TEXT,
  photo_url TEXT,
  source TEXT DEFAULT 'google_civic',
  external_id TEXT UNIQUE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reps_state ON representatives(state_code);
CREATE INDEX IF NOT EXISTS idx_reps_level ON representatives(level);
CREATE INDEX IF NOT EXISTS idx_reps_zip ON representatives USING GIN(zip_codes);

-- Cache table: maps a ZIP code to representative IDs
CREATE TABLE IF NOT EXISTS rep_lookup_cache (
  zip_code TEXT PRIMARY KEY,
  rep_ids UUID[],
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BILLS (synced from Congress.gov + LegiScan)
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('congress', 'legiscan')),
  bill_number TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  full_text_url TEXT,
  level TEXT NOT NULL CHECK (level IN ('federal', 'state')),
  state_code CHAR(2),
  status TEXT DEFAULT 'introduced',
  vote_date DATE,
  last_action TEXT,
  last_action_date DATE,
  sponsor TEXT,
  tags TEXT[],
  urgency_score FLOAT DEFAULT 0.2,
  change_hash TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_level ON bills(level);
CREATE INDEX IF NOT EXISTS idx_bills_state ON bills(state_code);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_urgency ON bills(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_bills_vote_date ON bills(vote_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_tags ON bills USING GIN(tags);

-- ============================================================
-- CALL LOGS (freemium enforcement + impact metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  representative_id UUID REFERENCES representatives(id),
  bill_id UUID REFERENCES bills(id),
  script_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'abandoned')),
  call_date DATE DEFAULT CURRENT_DATE,
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  script_type TEXT CHECK (script_type IN ('phone', 'email', 'town_hall'))
);

CREATE INDEX IF NOT EXISTS idx_call_logs_user_date ON call_logs(user_id, call_date);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(user_id, status);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call logs"
  ON call_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call logs"
  ON call_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call logs"
  ON call_logs FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- SCRIPTS (cached AI-generated call scripts)
-- ============================================================
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  representative_id UUID REFERENCES representatives(id),
  bill_id UUID REFERENCES bills(id),
  script_type TEXT NOT NULL,
  content TEXT NOT NULL,
  tone TEXT DEFAULT 'respectful',
  word_count INTEGER,
  was_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scripts"
  ON scripts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CALLENGES (gamification)
-- ============================================================
CREATE TABLE IF NOT EXISTS callenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_calls INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS callenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  callenge_id UUID REFERENCES callenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  calls_completed INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(callenge_id, user_id)
);

ALTER TABLE callenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE callenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view callenges"
  ON callenges FOR SELECT USING (TRUE);

CREATE POLICY "Users can create callenges"
  ON callenges FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own callenges"
  ON callenges FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view callenge participants"
  ON callenge_participants FOR SELECT USING (TRUE);

CREATE POLICY "Users can join callenges"
  ON callenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON callenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PERSONALIZED FEED RPC FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id UUID,
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  bill_number TEXT,
  title TEXT,
  summary TEXT,
  ai_summary TEXT,
  level TEXT,
  state_code TEXT,
  status TEXT,
  vote_date DATE,
  last_action TEXT,
  urgency_score FLOAT,
  tags TEXT[],
  full_text_url TEXT,
  feed_score FLOAT
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT DISTINCT ON (b.id)
    b.id,
    b.external_id,
    b.bill_number,
    b.title,
    b.summary,
    b.ai_summary,
    b.level,
    b.state_code,
    b.status,
    b.vote_date,
    b.last_action,
    b.urgency_score,
    b.tags,
    b.full_text_url,
    (
      (1.0 / NULLIF(ui.rank, 0)) *
      b.urgency_score *
      CASE WHEN b.state_code = (SELECT state_code FROM profiles WHERE id = p_user_id) THEN 1.3 ELSE 1.0 END
    )::FLOAT AS feed_score
  FROM bills b
  CROSS JOIN LATERAL UNNEST(b.tags) AS tag
  JOIN user_interests ui ON (ui.category = tag OR ui.subcategory = tag)
  WHERE
    ui.user_id = p_user_id
    AND b.status NOT IN ('signed', 'vetoed', 'failed')
    AND (
      b.level = 'federal'
      OR b.state_code = (SELECT state_code FROM profiles WHERE id = p_user_id)
    )
  ORDER BY b.id, feed_score DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Fallback function for users with no interests set
CREATE OR REPLACE FUNCTION get_default_feed(
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  bill_number TEXT,
  title TEXT,
  summary TEXT,
  ai_summary TEXT,
  level TEXT,
  state_code TEXT,
  status TEXT,
  vote_date DATE,
  last_action TEXT,
  urgency_score FLOAT,
  tags TEXT[],
  full_text_url TEXT
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    id, external_id, bill_number, title, summary, ai_summary,
    level, state_code, status, vote_date, last_action, urgency_score, tags, full_text_url
  FROM bills
  WHERE status NOT IN ('signed', 'vetoed', 'failed')
    AND level = 'federal'
  ORDER BY urgency_score DESC, last_action_date DESC
  LIMIT p_limit OFFSET p_offset;
$$;
