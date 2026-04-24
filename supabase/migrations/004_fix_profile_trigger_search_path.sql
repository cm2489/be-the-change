-- 004_fix_profile_trigger_search_path.sql
-- The handle_new_user trigger fires in the auth schema context where the default
-- search_path does not include public. Unqualified "profiles" fails with
-- "relation does not exist". Fix: qualify the table as public.profiles.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;
