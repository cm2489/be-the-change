# SCHEMA.md

Database schema reference. Read before writing any code that touches Supabase tables. Update this file whenever schema changes via migration.

---

## Conventions

- **Primary keys:** `id` column, `uuid` type, default `gen_random_uuid()`
- **Timestamps:** Every table has `created_at` and `updated_at`, both `timestamptz` with default `now()`
- **User references:** Always `user_id uuid references auth.users(id) on delete cascade`
- **RLS:** **ON for every table, no exceptions.** Users can only see/modify their own rows unless otherwise noted.
- **Naming:** `snake_case` for tables and columns, plural for table names (`bills` not `bill`)
- **Migrations:** Files in `supabase/migrations/` with format `YYYYMMDDHHMMSS_description.sql`

---

## MVP Tables

### `profiles`
Extended user data beyond `auth.users`. One row per user, created on signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, unique, on delete cascade | |
| `full_name` | text | |
| `email` | text | denormalized from auth.users for query convenience |
| `zip_code` | text, length 5 | validated |
| `full_address` | text, nullable | used for district-level rep lookup (optional) |
| `district_ocd_id` | text, nullable | Open Civic Data ID, populated after rep lookup |
| `values` | text[] | fixed list: equality, liberty, community, tradition, etc. |
| `issue_priorities` | text[] | ranked list of ~5 issue IDs from fixed taxonomy |
| `email_verified_at` | timestamptz, nullable | |
| `onboarding_completed_at` | timestamptz, nullable | |
| `reps_last_refreshed_at` | timestamptz, nullable | last time this user's federal reps were synced from Google Civic + Congress.gov; skip external calls if within the past 7 days unless address changed |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS:** User can SELECT/UPDATE own row. No DELETE (handled by auth cascade). No other user's rows visible.

---

### `user_interests`
Issue categories and subcategories selected during onboarding. Used to filter the bill feed and personalize AI script generation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `category` | text | top-level interest ID from `INTEREST_CATEGORIES` in `lib/interests.ts` |
| `subcategory` | text, nullable | subcategory ID; null means "all subcategories in this category" |
| `rank` | int | 1–99, lower = higher priority; used for feed scoring |
| `created_at` | timestamptz | |

Unique constraint: `NULLS NOT DISTINCT (user_id, category, subcategory)` — treats a category-only row (subcategory = null) as unique per user so it can't be inserted twice.

**RLS:** User can SELECT/INSERT/UPDATE/DELETE own rows (all ops via single `users_manage_own` policy).

---

### `representatives`
Federal reps. Shared cache across users — NOT user-specific.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `bioguide_id` | text, unique | Congress.gov's canonical ID |
| `full_name` | text | |
| `first_name` | text | |
| `last_name` | text | |
| `party` | text | "D", "R", "I", etc. |
| `state` | text, length 2 | |
| `district` | text, nullable | null for Senators |
| `chamber` | text | "house" or "senate" |
| `dc_office_phone` | text | |
| `photo_url` | text, nullable | |
| `website_url` | text, nullable | |
| `term_start` | date | |
| `term_end` | date | |
| `last_synced_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** All authenticated users can SELECT. Only service role can INSERT/UPDATE/DELETE.

---

### `user_representatives`
Join table linking users to their reps.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `representative_id` | uuid, FK → `representatives(id)`, on delete cascade | |
| `relationship_type` | text | "house", "senate_1", "senate_2" |
| `created_at`, `updated_at` | timestamptz | |

Unique constraint on `(user_id, relationship_type)`.

**RLS:** User can SELECT own rows. Service role handles INSERT/UPDATE.

---

### `bills`
Federal bills synced from Congress.gov.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `congress_number` | int | e.g., 119 |
| `bill_type` | text | "hr", "s", "hjres", "sjres" |
| `bill_number` | int | |
| `full_identifier` | text, unique | e.g., "hr-1234-119" |
| `title` | text | official title |
| `short_title` | text, nullable | |
| `summary_text` | text, nullable | Congress.gov summary if available |
| `ai_summary` | text, nullable | LLM-generated plain-English summary; one record per bill, shared across users; lazily generated on first detail-page view (Feature 4) |
| `sponsor_bioguide_id` | text | FK-style reference to `representatives.bioguide_id`; not enforced as a real FK because sponsors may not be in our reps cache |
| `introduced_date` | date | |
| `last_action_date` | date | |
| `last_action_text` | text | |
| `status` | text | "introduced", "committee", "markup", "floor_vote", "passed_chamber", "conference", "signed", "vetoed" |
| `issue_tags` | text[] | Tagger-emitted ids, both subcategory and derived parent-category (per `lib/bill-tagger.ts`); used for feed filtering and the relevance badge |
| `urgency_score` | numeric(4,3), NOT NULL DEFAULT 0 | Range [0.000, 1.000] enforced by CHECK; recomputed by cron on every upsert; see formula below |
| `issue_analysis` | jsonb, nullable | Per-bill structured impact analysis; one record covering all 10 top-level categories from `lib/interests.ts`; lazily generated on first detail-page view (Feature 4); never bulk-backfilled; shape below |
| `congress_gov_url` | text | |
| `last_synced_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** All authenticated users can SELECT. Only service role writes.

**Indexes:**
- `idx_bills_status` on `status`
- `idx_bills_issue_tags` GIN on `issue_tags`
- `idx_bills_last_action_date` on `last_action_date DESC`
- `idx_bills_urgency_score` on `(urgency_score DESC, last_action_date DESC)` — drives the urgency-sorted default feed and the urgency component of the personalized-feed sort
- `idx_bills_introduced_date` on `introduced_date DESC` — secondary sort signal

#### `urgency_score` formula

Computed in code (`lib/congress.ts`) and stored on every upsert. Range: `[0.000, 1.000]`, enforced by CHECK constraint. The earlier `vote_date` branch was dropped because Congress.gov's detail endpoint does not reliably surface scheduled vote dates and parsing them out of free-form `latestAction.text` is brittle (decision logged in STRATEGY.md §11, 2026-04-28). May be revisited in v1.1 after beta feedback.

**Step 1 — base weight from `status`:**

| Status | Base weight |
|---|---|
| `floor_vote` | 0.90 |
| `passed_chamber` | 0.75 |
| `conference` | 0.75 |
| `markup` | 0.65 |
| `committee` | 0.45 |
| `signed` | 0.30 |
| `vetoed` | 0.30 |
| `introduced` | 0.20 |
| (any other) | 0.20 |

**Step 2 — recency bonus from `last_action_date`:**

| Days since last action | Bonus |
|---|---|
| `< 3` | `+0.10` |
| `< 7` | `+0.05` |
| else / null | `+0.00` |

**Step 3 — clamp to `[0.000, 1.000]`.**

The base weight is the dominant signal. The bonus exists so that two bills at the same status step ranked alongside each other have the more recently active one float to the top.

#### `issue_analysis` jsonb shape

Single object per bill, covering every category the bill touches:

```json
{
  "plain_summary": "string — one paragraph plain-English summary",
  "issue_impacts": {
    "<top_level_category_id>": {
      "summary": "string — what the bill does in this issue area",
      "winners": ["who benefits"],
      "losers": ["who loses"],
      "stakes": "string — what's at stake if it passes / fails"
    }
  }
}
```

Keys under `issue_impacts` are **top-level category ids** from `lib/interests.ts` (e.g. `environment`, `healthcare`). The bill detail page filters this object to only the user's matched categories at render time.

Lazily generated on first detail-page view (Feature 4). One record per bill, shared across all users — analysis is about the bill's content, not the user. Never bulk-backfilled (a pre-warm script for demos is tracked in `docs/deferred.md`).

---

### `bill_actions`
Status changes on bills. Append-only audit log.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `bill_id` | uuid, FK → `bills(id)`, on delete cascade | |
| `action_date` | date | |
| `action_text` | text | |
| `action_type` | text | "introduced", "committee_referral", "floor_vote", etc. |
| `created_at` | timestamptz | |

**RLS:** All authenticated users SELECT. Service role writes.

---

### `followed_bills`
User's watchlist.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `bill_id` | uuid, FK → `bills(id)`, on delete cascade | |
| `stance` | text, nullable | "support", "oppose", "undecided" |
| `created_at`, `updated_at` | timestamptz | |

Unique on `(user_id, bill_id)`.

**RLS:** User can SELECT/INSERT/UPDATE/DELETE own rows.

---

### `script_generations`
Cache + audit log for AI-generated scripts. Critical for cost control.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `bill_id` | uuid, FK → `bills(id)`, on delete cascade | |
| `stance` | text | "support", "oppose", "undecided" |
| `script_text` | text | the generated script |
| `prompt_hash` | text | SHA-256 of the input prompt, for cache validation |
| `model` | text | e.g., "claude-sonnet-4-5" |
| `input_tokens` | int | |
| `output_tokens` | int | |
| `cost_usd` | numeric(10,6) | computed from token counts |
| `created_at` | timestamptz | |

Unique on `(user_id, bill_id, stance)` — enforces the cache.

**RLS:** User can SELECT own rows. Service role writes.

---

### `call_events`
Log of calls made by users (self-reported).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `bill_id` | uuid, FK → `bills(id)`, on delete cascade | |
| `representative_id` | uuid, FK → `representatives(id)`, on delete cascade | |
| `script_generation_id` | uuid, FK → `script_generations(id)`, nullable | |
| `created_at` | timestamptz | |

**RLS:** User can SELECT own rows.

---

### `push_subscriptions`
Web Push subscription objects.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `endpoint` | text, unique | |
| `p256dh_key` | text | |
| `auth_key` | text | |
| `user_agent` | text, nullable | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** User can INSERT/SELECT/DELETE own. Service role reads for sending.

---

### `notifications_sent`
Rate-limiting + audit log for push notifications.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid, FK → `auth.users(id)`, on delete cascade | |
| `bill_id` | uuid, FK → `bills(id)`, nullable, on delete set null | |
| `notification_type` | text | "bill_action", "reminder", etc. |
| `delivery_status` | text | "sent", "failed", "blocked_by_rate_limit", "blocked_by_quiet_hours" |
| `created_at` | timestamptz | |

**RLS:** User can SELECT own. Service role writes.

**Index:** On `(user_id, created_at DESC)` for fast rate-limit queries.

---

### `sync_state`
Single-row table tracking the cron's last successful incremental sync plus diagnostics. The cron passes `last_successful_sync_at - 48 hours` as `fromDateTime` to Congress.gov, so a brief sync failure can't drop a day's worth of bill updates. The `last_sync_status` + `last_sync_error` columns give an in-DB signal when the cron starts failing silently — the recurrence we're trying to prevent (see `schema-drift-sync-bills` in `docs/deferred.md`). Single-row enforcement uses a unique index on the constant expression `(1)`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `last_successful_sync_at` | timestamptz, nullable | Null on first run; set to `now()` after a successful sync; not advanced on failure |
| `last_sync_status` | text, nullable | CHECK in `('success', 'partial', 'failed')`; written by the cron on every run |
| `last_sync_error` | text, nullable | Error message from the most recent failed run; cleared on next success |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** Enabled with **no policies** — authenticated users have no access. All reads and writes go through service role from the cron route, which bypasses RLS. **Do not add a SELECT policy without also restricting INSERT/UPDATE/DELETE explicitly:** RLS-enabled-with-no-policies denies all authenticated access, but adding any single permissive policy without writing matching restrictive policies for other operations may inadvertently open writes.

---

## RPC Functions

Postgres functions called via `supabase.rpc(...)`. All `SECURITY INVOKER` (caller's RLS applies) with `search_path = public` pinned.

### `get_personalized_feed(p_user_id uuid, p_offset int, p_limit int)`

Personalized bill feed for users with at least one `user_interests` row. Joins `bills` against the user's selected categories, intersects with `bills.issue_tags` (which carries both subcategory ids and parent-category ids from the tagger), and ranks by a composite of relevance count and urgency.

**Sort key — both terms in `[0, 1]`, weighted 0.4 / 0.6:**

```
relevance_ratio = cardinality(matched_tags) / user_cat_count
composite       = COALESCE(relevance_ratio, 0) * 0.4 + urgency_score * 0.6   DESC
                  last_action_date                                            DESC NULLS LAST
```

`user_cat_count` is the number of distinct categories the user picked in `user_interests` (computed from the same CTE the join uses). The `NULLIF` guards a div-by-zero that shouldn't occur — this RPC is only invoked when the user has at least one interest — but the COALESCE keeps callers honest.

A user with three categories looking at a bill that matches all three (`relevance_ratio = 1.0`) at `urgency_score = 0.5` scores `1.0 * 0.4 + 0.5 * 0.6 = 0.70`. A bill matching one of three categories at `urgency_score = 0.9` scores `0.333 * 0.4 + 0.9 * 0.6 = 0.673`. Relevance and urgency now compete on the same scale, so the 0.4 / 0.6 weights describe a real tradeoff rather than dimensional accident.

**Returns** (one row per matching bill):

| Column | Type | Source |
|---|---|---|
| `id`, `full_identifier`, `title`, `ai_summary`, `summary_text`, `status`, `last_action_text`, `last_action_date`, `introduced_date`, `urgency_score`, `issue_tags`, `congress_gov_url` | as in `bills` | `bills` |
| `matched_tags` | text[] | Intersection of `bills.issue_tags` ∩ user's `user_interests.category` set; powers the "Matches your priorities on X" badge |

### `get_default_feed(p_offset int, p_limit int)`

Default bill feed for users with empty `user_interests`. Same column shape as the personalized feed minus `matched_tags`. Sort key:

```
urgency_score    DESC
last_action_date DESC NULLS LAST
```

Renders behind a banner that nudges the user to complete onboarding.

---

## RLS Policy Template

Every table gets policies like this, adjusted per table:

```sql
-- Enable RLS
alter table public.TABLE_NAME enable row level security;

-- SELECT own rows
create policy "users_select_own"
  on public.TABLE_NAME for select
  using (auth.uid() = user_id);

-- INSERT own rows (if applicable)
create policy "users_insert_own"
  on public.TABLE_NAME for insert
  with check (auth.uid() = user_id);

-- UPDATE own rows (if applicable)
create policy "users_update_own"
  on public.TABLE_NAME for update
  using (auth.uid() = user_id);

-- DELETE own rows (if applicable)
create policy "users_delete_own"
  on public.TABLE_NAME for delete
  using (auth.uid() = user_id);
```

For shared-read tables (e.g., `representatives`, `bills`):

```sql
create policy "authenticated_can_read"
  on public.TABLE_NAME for select
  to authenticated
  using (true);
```

Writes on shared tables are done via `SUPABASE_SERVICE_ROLE_KEY` from server-only contexts, which bypasses RLS.

---

## Schema Change Process

1. Create a new file in `supabase/migrations/` with format `YYYYMMDDHHMMSS_description.sql`
2. Write the migration (forward-only — no "down" migrations)
3. Test locally: `supabase db reset` then inspect
4. Update this `SCHEMA.md` file in the same commit
5. Push to Supabase: `supabase db push`
6. Commit both the migration and the updated `SCHEMA.md`

Never modify the database via the Supabase dashboard for anything that should be version-controlled.
