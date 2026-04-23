---
name: Schema alignment — 001 → 002 column renames and constraints
description: Documents old→new column renames from migration 002 and known constraints to handle during Feature 2 implementation
type: reference
---

## Context

Migration `002_align_to_schema.sql` dropped the original schema (which had scope-creep tables and misnamed columns) and recreated all tables per `SCHEMA.md`. The old schema had grown organically and diverged significantly from the canonical design.

---

## Column renames

### `bills`

| Old column | New column | Notes |
|---|---|---|
| `external_id` | `full_identifier` | Also changed from `text UNIQUE` to format `"{type}-{number}-{congress}"` e.g. `"hr-1234-119"` |
| `summary` | `summary_text` | |
| `tags` | `issue_tags` | |
| `last_action` | `last_action_text` | |
| `synced_at` | `last_synced_at` | |
| `sponsor` | `sponsor_bioguide_id` | Was free-text name; now bioguide ID string |
| `bill_number` | `bill_number` | Type changed: `text` → `int` |
| *(absent)* | `congress_number` | New: int, e.g. `119` |
| *(absent)* | `bill_type` | New: e.g. `"hr"`, `"s"`, `"hjres"` |
| *(absent)* | `short_title` | New: nullable |
| *(absent)* | `introduced_date` | New: `date NOT NULL` |
| *(absent)* | `congress_gov_url` | New: `text NOT NULL` |
| `source` | *(dropped)* | Was `"congress"` or `"legiscan"` — state bills deferred, all bills are federal |
| `level` | *(dropped)* | Same reason — always `"federal"` now |
| `state_code` | *(dropped)* | Federal only |
| `urgency_score` | *(dropped)* | Not in SCHEMA.md |
| `vote_date` | *(dropped)* | Not in SCHEMA.md |
| `full_text_url` | *(dropped)* | Not in SCHEMA.md |
| `change_hash` | *(dropped)* | Not in SCHEMA.md |

### `representatives`

| Old column | New column | Notes |
|---|---|---|
| `external_id` | `bioguide_id` | Now `text NOT NULL UNIQUE` |
| `phone` | `dc_office_phone` | |
| `state_code` | `state` | Type: `char(2)` → `text` with length check |
| `zip_codes` | *(dropped)* | Reps are looked up by district, not zip |
| `title` | *(dropped)* | e.g. "Representative" — not in SCHEMA.md |
| `level` | *(dropped)* | Always `"federal"` |
| `email` | *(dropped)* | MVP uses phone only |
| `source` | *(dropped)* | Was defaulting to `'google_civic'` — that API is shut down |
| *(absent)* | `first_name`, `last_name` | New: `text NOT NULL` |
| *(absent)* | `district` | New: nullable (null for Senators) |
| *(absent)* | `chamber` | New: `"house"` or `"senate"` |
| *(absent)* | `term_start`, `term_end` | New: `date NOT NULL` |

### `push_subscriptions`

| Old column | New column |
|---|---|
| `p256dh` | `p256dh_key` |

### Renamed tables

| Old table | New table |
|---|---|
| `call_logs` | `call_events` |
| `scripts` | `script_generations` |

### Dropped tables (out of scope)

| Table | Reason |
|---|---|
| `callenges` | Social/gamification — deferred to v2+ |
| `callenge_participants` | Same |
| `user_interests` | Replaced by `profiles.issue_priorities` (text[]) |
| `rep_lookup_cache` | Not in SCHEMA.md |

---

## Known constraint: `representatives.dc_office_phone NOT NULL`

**The constraint:** `dc_office_phone text NOT NULL` per SCHEMA.md.

**The risk:** The Congress.gov Members API (`/v3/member`) sometimes omits office contact info for freshly-sworn members or members in transition. If `dc_office_phone` is absent from the API response, the upsert will fail.

**How to handle in Feature 2 (rep lookup implementation):**

Option A (recommended): Coalesce to empty string on insert — `COALESCE(api_phone, '')` — so the row is never null. The UI can check for empty string and show "Phone not available."

Option B: Relax the constraint to nullable in a follow-on migration if empty string semantics are confusing.

Decide at implementation time. Flag this when writing `lib/representatives.ts`.

---

## `profiles` pattern change

Old schema: `profiles.id = auth.users.id` (profiles.id was both PK and FK).

New schema: `profiles.id` is its own generated UUID; `profiles.user_id` is the FK to `auth.users(id)`. RLS policies now reference `user_id`, not `id`. The `handle_new_user()` trigger was updated accordingly.

**Impact:** Any code that does `profiles.eq('id', session.user.id)` must be updated to `profiles.eq('user_id', session.user.id)`.
