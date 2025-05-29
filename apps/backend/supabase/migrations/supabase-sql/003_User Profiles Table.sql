-- ============================================================
-- Script to Create/Reset the 'profiles' Table
-- ============================================================
-- Purpose: Stores user-specific profile information, including membership status,
--          linking to Supabase auth users and membership tiers.
-- Idempotent: Yes - Drops existing table and its dependent objects (like policies, triggers)
--          before recreating.
-- WARNING: Dropping the table with CASCADE will also drop dependent objects
--          (like foreign key constraints in 'divinations' referencing this table).
--          Run with caution, especially on existing databases.
-- Requires: The 'membership_tiers' table must exist.
-- ============================================================

-- ** Step 1: Drop Existing Trigger Function (if it exists) **
-- This function is commonly used for updating 'updated_at' timestamps.
DROP FUNCTION IF EXISTS public.trigger_set_timestamp() CASCADE;

-- ** Step 2: Drop Existing Table (and automatically drop dependent policies/constraints/triggers) **
-- Use CASCADE to remove dependencies cleanly.
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ** Step 3: Create the 'profiles' Table **
CREATE TABLE public.profiles (
    -- User's unique ID, matching the ID in auth.users. Primary Key.
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Foreign key to the membership_tiers table.
    -- The default value will be set by the 'handle_new_user' trigger.
    membership_tier_id INT NOT NULL,

    -- Timestamp indicating when the premium membership expires. NULL for non-premium users.
    premium_expiration TIMESTAMPTZ NULL,

    -- Timestamp when the profile was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamp when the profile was last updated. Automatically updated by trigger.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure the membership tier FK constraint is added
    CONSTRAINT fk_membership_tier
        FOREIGN KEY(membership_tier_id)
        REFERENCES public.membership_tiers(id)
        -- Removed ON DELETE SET DEFAULT as default is handled by trigger.
        -- Consider ON DELETE RESTRICT or ON DELETE NO ACTION if deleting a tier should be prevented
        -- if users are assigned to it, or handle this logic elsewhere.
        -- ON DELETE RESTRICT is often safer for lookup tables.
        ON DELETE RESTRICT
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.profiles IS 'Stores user profile information, including membership status and links to auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, matches auth.users.id. Primary Key.';
COMMENT ON COLUMN public.profiles.membership_tier_id IS 'Foreign key referencing the user''s current membership tier (default set by trigger).';
COMMENT ON COLUMN public.profiles.premium_expiration IS 'Timestamp when premium membership expires (NULL if not premium or expired).';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when the profile was created.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when the profile was last updated (auto-updated).';


-- ** Step 4: Create Indexes **
-- Index on the foreign key for potentially faster joins or filtering by tier.
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier_id ON public.profiles(membership_tier_id);
-- Index on premium_expiration might be useful for finding expiring/expired users.
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expiration ON public.profiles(premium_expiration);


-- ** Step 5: Create Function and Trigger for 'updated_at' **
-- This function automatically updates the 'updated_at' column whenever a row is updated.
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the 'profiles' table.
CREATE TRIGGER set_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

COMMENT ON TRIGGER set_profiles_timestamp ON public.profiles IS 'Automatically updates the updated_at timestamp on row update.';


-- ** Step 6: Enable Row Level Security (RLS) **
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;


-- ** Step 7: Create RLS Policies **
-- Policies are automatically dropped by `DROP TABLE ... CASCADE`, so we just recreate them.

-- Policy 1: Allow users to read their own profile.
CREATE POLICY "Allow users to read their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile.
-- Backend MUST validate which fields are allowed to be updated.
CREATE POLICY "Allow users to update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to insert their own profile (for the handle_new_user trigger).
CREATE POLICY "Allow users to insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Allow users to delete their own profile (CASCADE from auth.users is primary).
CREATE POLICY "Allow users to delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- Policy 5: Allow full access for users with the 'service_role'.
CREATE POLICY "Allow service_role full access"
    ON public.profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');


-- ** Step 8: Grant Permissions **
-- Grant necessary permissions to the 'authenticated' role based on the RLS policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

-- Grant necessary permissions to the 'service_role'.
GRANT ALL ON TABLE public.profiles TO service_role;
-- Grant execute on the trigger function to roles that might cause updates.
GRANT EXECUTE ON FUNCTION public.trigger_set_timestamp() TO authenticated, service_role;


-- ============================================================
-- End of Script for 'profiles'
-- ============================================================