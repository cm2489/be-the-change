---
name: Supabase trigger search_path — qualify table names as public.tablename
description: Triggers on auth.users run in the auth schema context where search_path excludes public. Unqualified table names fail with "relation does not exist" at runtime even though the table exists.
type: reference
---

## Context

When Supabase's GoTrue auth service fires a trigger on `auth.users` (e.g. `on_auth_user_created`), the trigger function executes in the `auth` schema context. Postgres resolves unqualified table names using `search_path`, and in this context `public` is not included. Any reference to a table without an explicit schema prefix will fail at runtime.

This is not caught by `supabase db push`, local testing, or any migration tooling — the SQL is valid, the trigger is created successfully, and the migration applies cleanly. The failure only surfaces when a real signup attempt fires the trigger in production.

**Error seen in Supabase auth logs:**

```
ERROR: relation "profiles" does not exist (SQLSTATE 42P01)
500: Database error saving new user
```

---

## Root cause

```sql
-- BROKEN — "profiles" cannot be resolved from the auth schema context
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;
```

GoTrue inserts into `auth.users`, the trigger fires, and Postgres looks for `profiles` in `auth` first, then whatever `search_path` is set to — which does not include `public` in this execution context.

---

## Fix

Qualify every table reference with its schema name:

```sql
-- CORRECT — explicit schema prefix bypasses search_path entirely
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;
```

---

## When this applies

Any trigger function that fires on `auth.users` and references tables in `public` (or any other schema). This includes:

- Profile auto-creation on signup (`AFTER INSERT ON auth.users`)
- Soft-delete or anonymisation hooks (`AFTER DELETE ON auth.users`)
- Any future trigger that syncs auth state to application tables

The rule: **if the trigger is on `auth.*`, always prefix table names with `public.`**

Triggers on tables within `public` (e.g. `AFTER INSERT ON public.bills`) are unaffected — their default search_path already includes `public`.

---

## How we diagnosed it

1. Signup returned "Database error saving new user" from Supabase
2. Checked auth logs via `supabase_mcp.get_logs(service: "auth")` — saw `42P01: relation "profiles" does not exist`
3. Confirmed the trigger function body via `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'` — function logic was correct, table name was unqualified
4. Recognised the auth schema context as the cause; fixed with `public.profiles`

Applied in migration `004_fix_profile_trigger_search_path.sql`.
