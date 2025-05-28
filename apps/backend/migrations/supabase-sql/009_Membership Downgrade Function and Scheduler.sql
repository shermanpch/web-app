-- ============================================================
-- Script to Create Membership Downgrade Function and Cron Job
-- ============================================================
-- Purpose: Defines a PostgreSQL function to downgrade users with
--          expired premium memberships to the 'free' tier and
--          schedules this function to run daily using pg_cron.
-- Idempotent: Yes - The function creation uses CREATE OR REPLACE.
--           The cron job scheduling uses cron.schedule which will
--           update an existing job with the same name or create
--           a new one. If an old job with the same name but different
--           schedule/command exists, it will be overwritten.
-- Dependencies: Assumes 'profiles' and 'membership_tiers' tables exist.
--             Assumes pg_cron extension is enabled in Supabase.
-- ============================================================

-- ** Step 1: Define the PostgreSQL function 'downgrade_expired_memberships' **
-- This function will find users with expired premium memberships and update them.
CREATE OR REPLACE FUNCTION public.downgrade_expired_memberships()
RETURNS integer -- Returns the number of users updated
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who defined it (owner).
                 -- Necessary for cron jobs that need to modify data across schemas or with elevated privileges.
AS $$
DECLARE
    free_tier_id_val int;      -- Stores the ID of the 'free' membership tier.
    updated_rows_count int := 0; -- Counter for the number of users successfully updated.
BEGIN
    -- Get the ID of the 'free' membership tier from the 'membership_tiers' table.
    SELECT id INTO free_tier_id_val
    FROM public.membership_tiers
    WHERE name = 'free'
    LIMIT 1;

    -- If the 'free' tier ID is not found, log a warning and exit the function.
    -- This prevents errors if the 'free' tier is missing or misnamed.
    IF free_tier_id_val IS NULL THEN
        RAISE WARNING 'downgrade_expired_memberships: "free" membership tier not found in membership_tiers. No users updated.';
        RETURN 0;
    END IF;

    -- Identify and update user profiles that meet the downgrade criteria:
    -- 1. 'premium_expiration' is not NULL (they had a premium membership).
    -- 2. 'premium_expiration' is in the past (less than the current UTC time).
    -- 3. Their current 'membership_tier_id' is not already the 'free' tier ID.
    WITH users_to_downgrade AS (
        SELECT id
        FROM public.profiles
        WHERE premium_expiration IS NOT NULL
          AND premium_expiration < (NOW() AT TIME ZONE 'UTC')
          AND membership_tier_id != free_tier_id_val
    )
    UPDATE public.profiles
    SET 
        membership_tier_id = free_tier_id_val, -- Set to 'free' tier ID.
        premium_expiration = NULL,             -- Clear the expiration date.
        updated_at = (NOW() AT TIME ZONE 'UTC')  -- Update the 'updated_at' timestamp.
    WHERE id IN (SELECT id FROM users_to_downgrade);

    -- Retrieve the number of rows affected by the UPDATE statement.
    GET DIAGNOSTICS updated_rows_count = ROW_COUNT;

    -- Log the outcome of the operation.
    IF updated_rows_count > 0 THEN
        RAISE NOTICE 'downgrade_expired_memberships: Successfully downgraded % user(s) to the free tier.', updated_rows_count;
    ELSE
        RAISE NOTICE 'downgrade_expired_memberships: No users required downgrading at this time.';
    END IF;
    
    -- Return the count of updated users.
    RETURN updated_rows_count;

EXCEPTION
    -- Catch any unexpected errors during function execution.
    WHEN OTHERS THEN
        RAISE WARNING 'downgrade_expired_memberships: An error occurred: %', SQLERRM;
        RETURN 0; -- Indicate failure or no updates due to error.
END;
$$;

-- Add comments to the function for clarity
COMMENT ON FUNCTION public.downgrade_expired_memberships() IS 
'Scans the profiles table for users with expired premium_expiration dates and changes their membership_tier_id to the "free" tier, setting premium_expiration to NULL. Runs daily via pg_cron.';


-- ** Step 2: Schedule the function using pg_cron **
-- This schedules the 'downgrade_expired_memberships' function to run automatically.
-- WARNING: pg_cron extension must be enabled in your Supabase project for this to work.
--          You can enable it from the Supabase Dashboard (Database > Extensions).

-- Cron job name: 'daily-membership-downgrade'. This name is used to identify and manage the job.
-- Cron schedule: '0 0 * * *'. This means "at 00:00 (midnight) every day" UTC.
-- Command to execute: Calls the 'public.downgrade_expired_memberships()' function.
SELECT cron.schedule(
    'daily-membership-downgrade', -- Name of the cron job
    '0 0 * * *',                  -- Cron expression: daily at 00:00 UTC
    $$SELECT public.downgrade_expired_memberships();$$ -- SQL command to execute
);

-- ** Optional: How to check scheduled jobs (run in Supabase SQL Editor) **
-- SELECT * FROM cron.job;

-- ** Optional: How to check job run details (run in Supabase SQL Editor) **
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ** Optional: How to unschedule the job (if needed, e.g., for a down migration) **
-- SELECT cron.unschedule('daily-membership-downgrade');


-- ============================================================
-- End of Script for Membership Downgrade Function and Cron Job
-- ============================================================
-- Reminder: Ensure the pg_cron extension is enabled in your
--           Supabase project via the dashboard.
-- ============================================================