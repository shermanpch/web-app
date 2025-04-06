-- Function to insert default quota for a new user
-- Run this AFTER creating the user_quotas table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Allows function to run with creator's permissions (e.g., postgres role)
                 -- Make sure the role creating this function has INSERT rights on public.user_quotas
SET search_path = public -- Ensures it finds the user_quotas table correctly
AS $$
BEGIN
  -- Insert a new row into public.user_quotas for the newly created user
  INSERT INTO public.user_quotas (user_id, membership_type, remaining_queries)
  VALUES (
    NEW.id, -- The user_id from the newly inserted row in auth.users
    'free', -- Default membership type
    10      -- Default remaining queries (adjust if needed)
  );

  -- Optional: Log the action (requires appropriate logging setup or use RAISE NOTICE)
  -- RAISE NOTICE 'Created default quota for user %', NEW.id;

  RETURN NEW; -- Return the newly inserted user row (standard practice for AFTER triggers)

EXCEPTION
  WHEN unique_violation THEN
    -- This handles the unlikely case where a quota record for this user_id already exists
    -- (e.g., manual intervention, race condition, or re-running signup logic).
    -- We log a warning but allow the user creation process to succeed.
    RAISE WARNING '[handle_new_user] Quota already exists for user % - trigger skipped insert.', NEW.id;
    RETURN NEW; -- Allow the original INSERT on auth.users to succeed

  WHEN OTHERS THEN
    -- Catch any other unexpected errors during quota insertion.
    -- Log the error and allow the user creation to succeed.
    -- If having a quota is absolutely critical for the app to function,
    -- you might consider raising an exception here to potentially roll back
    -- the user creation, but that can lead to complex error handling.
    RAISE WARNING '[handle_new_user] Error creating quota for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Allow the original INSERT on auth.users to succeed despite quota error

END;
$$;

-- Grant execute permission on the function to the supabase_auth_admin role
-- This role is typically used by Supabase's internal auth operations
-- Adjust if using a different setup
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
-- Also grant to postgres role if needed for direct invocation/testing
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;