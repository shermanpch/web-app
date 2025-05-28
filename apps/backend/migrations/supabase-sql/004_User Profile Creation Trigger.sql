-- ============================================================
-- Script to Create/Reset the 'handle_new_user' Function and Trigger
-- ============================================================
-- Purpose: Creates a function that automatically inserts a profile record
--          into 'public.profiles' when a new user is created in 'auth.users'.
--          Also creates the trigger on 'auth.users' to call this function.
-- Idempotent: Yes - Uses CREATE OR REPLACE for the function and drops/recreates
--          the trigger.
-- Requires: The 'public.profiles' and 'public.membership_tiers' tables must exist.
--           The 'public.membership_tiers' table must have an entry with name = 'free'.
-- ============================================================

-- ** Step 1: Create or Replace the 'handle_new_user' Function **
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who defined it (typically postgres or admin)
                 -- This is necessary to potentially bypass RLS if needed, although here we insert into public.profiles
                 -- which the user might have INSERT rights for via RLS anyway. SECURITY DEFINER is safer for broader cases.
SET search_path = public -- Ensures the function can find tables in the public schema without specifying public.tablename
AS $$
DECLARE
  free_tier_id INT;
BEGIN
  -- Find the ID for the 'free' membership tier
  SELECT id INTO free_tier_id FROM public.membership_tiers WHERE name = 'free' LIMIT 1;

  -- Check if the free tier was found
  IF free_tier_id IS NULL THEN
    RAISE EXCEPTION '[handle_new_user] Could not find membership tier with name ''free''. Cannot create profile.';
    -- Alternatively, you could log a warning and return NEW, but failing ensures data integrity.
    -- RETURN NEW;
  END IF;

  -- Insert a new row into public.profiles for the newly created user
  INSERT INTO public.profiles (id, membership_tier_id)
  VALUES (
    NEW.id,         -- The user_id from the newly inserted row in auth.users
    free_tier_id    -- The ID found for the 'free' tier
  );

  -- Optional: Log the action (useful for debugging)
  -- RAISE NOTICE '[handle_new_user] Created profile for user % with free tier ID %', NEW.id, free_tier_id;

  RETURN NEW; -- Return the row that was inserted into auth.users

EXCEPTION
  WHEN unique_violation THEN
    -- This handles the unlikely case where a profile record for this user_id already exists
    -- (e.g., manual intervention, race condition, or re-running signup logic).
    -- We log a warning but allow the user creation process to succeed.
    RAISE WARNING '[handle_new_user] Profile already exists for user % - trigger skipped insert.', NEW.id;
    RETURN NEW; -- Allow the original INSERT on auth.users to succeed

  WHEN OTHERS THEN
    -- Catch any other unexpected errors during profile insertion.
    -- Log the error and allow the user creation to succeed by default.
    -- If having a profile is absolutely critical, you might re-raise the exception here
    -- which would roll back the user creation in auth.users.
    RAISE WARNING '[handle_new_user] Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Allow the original INSERT on auth.users to succeed despite profile error

END;
$$;

-- Add comments to the function
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile in public.profiles for a new user signing up via auth.users, assigning the default ''free'' membership tier.';


-- ** Step 2: Drop Existing Trigger (if it exists) **
-- Ensures we don't have duplicate triggers if the script is run multiple times.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;


-- ** Step 3: Create the Trigger on 'auth.users' **
-- This trigger executes the 'handle_new_user' function AFTER a new row (user)
-- is inserted into the auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment to the trigger
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Calls the handle_new_user function to create a profile whenever a new user is added to auth.users.';


-- ** Step 4: Grant Permissions (Important for Supabase Auth) **
-- Grant EXECUTE permission on the function to the 'supabase_auth_admin' role.
-- This special role is used internally by Supabase Auth operations.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Optional: Grant execute to postgres or other admin roles if needed for testing/manual calls.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;


-- ============================================================
-- End of Script for 'handle_new_user' Function and Trigger
-- ============================================================