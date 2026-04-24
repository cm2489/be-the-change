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
| `ai_summary` | text, nullable | LLM-generated plain-English summary (cached) |
| `sponsor_bioguide_id` | text | FK to reps via bioguide_id |
| `introduced_date` | date | |
| `last_action_date` | date | |
| `last_action_text` | text | |
| `status` | text | "introduced", "committee", "floor", "passed_chamber", "enacted", etc. |
| `issue_tags` | text[] | LLM-classified issue tags, used for filtering by user priorities |
| `congress_gov_url` | text | |
| `last_synced_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** All authenticated users can SELECT. Only service role writes.

**Indexes:** On `status`, `issue_tags` (GIN), `last_action_date` (DESC).

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
