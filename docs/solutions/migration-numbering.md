---
name: Migration numbering — append-only, never renumber
description: Supabase migration files are append-only. On a number collision (e.g. a planning doc says "003" but "003_*" already exists), take the next free number. Never rename, reorder, or renumber existing migration files.
type: reference
---

## The rule

Migrations in `supabase/migrations/` are append-only. The numeric prefix is for ordering, the descriptive suffix is what humans read. **On a number conflict, take the next free number.**

If a planning doc names a migration `003_feature_x.sql` but `003_user_interests.sql` already exists, the new file becomes `006_feature_x.sql` (or whatever the next free integer is). The descriptive name stays.

## Why it matters

Supabase tracks applied migrations in `supabase_migrations.schema_migrations`, keyed by the file's numeric prefix. Renaming or renumbering a file that has already been applied means:

- the next `supabase db push` thinks the renamed file is a new migration and tries to apply it again
- the original prefix is still in the migrations table but the file is gone, breaking history
- recovering requires either a destructive `supabase db reset` (impossible against production data) or hand-editing the migrations table

Forward-only migrations are non-negotiable for the same reason rebasing public branches is: anything downstream of you (other contributors, CI, prod) has already pinned the old order.

## What to do on a conflict

1. `ls supabase/migrations/` to see the highest existing number.
2. Use `<next_number>_<descriptive_name>.sql`.
3. Update the plan/PR description to use the new filename — don't try to "preserve" the originally-planned number.

That's it. The number is plumbing; the description is the document.

## One-time exception — 2026-06-06 (007/008/009 renamed to timestamps)

Three already-applied migrations were renamed **once**. This does not contradict the rule above; it *restores* the invariant the rule protects.

`007_crs_reanchor.sql`, `008_feed_order_tiebreaker.sql`, and `009_add_ai_headline.sql` were applied to prod via the Supabase **MCP `apply_migration`** path, which records a generated **timestamp** as the ledger version — not the file's numeric prefix the way `supabase db push` does (which is how 001–006 were applied). So prod's `schema_migrations` held `20260603133555` / `20260605182345` / `20260606152313` while the files on disk still said `007/008/009`. The file↔version link this rule protects was already broken — by the apply path, not by a rename.

The correction renamed each file so its prefix equals its recorded ledger version **character-for-character**:

| old filename | new filename |
|---|---|
| `007_crs_reanchor.sql` | `20260603133555_crs_reanchor.sql` |
| `008_feed_order_tiebreaker.sql` | `20260605182345_feed_order_tiebreaker.sql` |
| `009_add_ai_headline.sql` | `20260606152313_add_ai_headline.sql` |

After the rename, `supabase db push` sees all three as already-applied (prefix == recorded version) and will not re-run them. **No prod write was involved** — the ledger already held the timestamps; only the repo files moved.

**The rule still stands for every future migration.** This was a one-time correction of a pre-existing mismatch, not license to renumber. The durable prevention: apply tracked migrations through a single path, and validate locally first (see `docs/deferred.md#local-supabase-stack`). Full context: `docs/deferred.md#migration-history-version-mismatch`.
