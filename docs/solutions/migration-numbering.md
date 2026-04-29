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
