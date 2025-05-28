-- ============================================================
-- Script to Create/Reset the 'divinations' Table
-- ============================================================
-- Purpose: Logs each instance of a user performing a divination action,
--          linking to the user ('profiles') and the feature ('features') used.
--          This table is used to track usage against weekly quotas.
-- Idempotent: Yes - Drops existing table and its dependent objects (like policies)
--          before recreating.
-- WARNING: Dropping the table with CASCADE is generally safe here as it's mostly
--          a log table, but be aware if other tables were made dependent on it.
-- Requires: The 'public.profiles' and 'public.features' tables must exist.
-- ============================================================
-- ** Step 1: Drop Existing Table (and automatically drop dependent policies/constraints) **
-- Use CASCADE to remove dependencies cleanly.
DROP TABLE IF EXISTS public.divinations CASCADE;

-- ** Step 2: Create the 'divinations' Table **
CREATE TABLE
    public.divinations (
        -- Unique identifier for the divination log entry. Auto-incrementing big integer.
        id BIGSERIAL PRIMARY KEY,
        -- Foreign key to the user's profile. If the profile/user is deleted, these logs are removed.
        user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
        -- Foreign key to the feature used (e.g., 'basic_divination' or 'premium_divination').
        -- If a feature definition is deleted, restrict deletion to prevent losing usage context,
        -- or set to NULL if preferred. RESTRICT is often safer for logs.
        feature_id INT NOT NULL REFERENCES public.features (id) ON DELETE RESTRICT,
        -- Timestamp when the divination action was performed. Defaults to the time of insertion.
        performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        -- Optional field to store additional details about the divination,
        -- such as the question asked, numbers used, or a summary of the result.
        -- JSONB is efficient for querying structured data within the details.
        details JSONB NULL
    );

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.divinations IS 'Logs each divination action performed by users, used for quota tracking.';

COMMENT ON COLUMN public.divinations.id IS 'Primary key for the divination log entry.';

COMMENT ON COLUMN public.divinations.user_id IS 'Foreign key referencing the user who performed the divination.';

COMMENT ON COLUMN public.divinations.feature_id IS 'Foreign key referencing the specific divination feature used.';

COMMENT ON COLUMN public.divinations.performed_at IS 'Timestamp when the divination was performed.';

COMMENT ON COLUMN public.divinations.details IS 'Optional JSONB field for storing details about the divination (e.g., question, result summary).';

-- ** Step 3: Create Indexes **
-- Index on user_id is CRUCIAL for RLS performance and querying user-specific usage.
CREATE INDEX IF NOT EXISTS idx_divinations_user_id ON public.divinations (user_id);

-- Composite index to efficiently count usage per user, per feature, within a time window (for quota checks).
CREATE INDEX IF NOT EXISTS idx_divinations_user_feature_time ON public.divinations (user_id, feature_id, performed_at DESC);

-- Using DESC on performed_at might slightly optimize queries looking for recent usage within a week.
-- Optional: Index on performed_at alone if global time-based queries are common.
-- CREATE INDEX IF NOT EXISTS idx_divinations_performed_at ON public.divinations(performed_at);
-- Optional: GIN index on the 'details' JSONB column if you plan to query its contents frequently.
-- CREATE INDEX IF NOT EXISTS idx_divinations_details_gin ON public.divinations USING GIN (details);
-- ** Step 4: Enable Row Level Security (RLS) **
ALTER TABLE public.divinations ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE public.divinations FORCE ROW LEVEL SECURITY;

-- ** Step 5: Create RLS Policies **
-- Policies are automatically dropped by `DROP TABLE ... CASCADE`, so we just recreate them.
-- Policy 1: Allow users to read their own divination logs.
CREATE POLICY "Allow users to read their own divination logs" ON public.divinations FOR
SELECT
    USING (auth.uid () = user_id);

-- Policy 2: Allow users to insert their own divination logs.
-- This assumes the application logic (or a trigger) performs quota checks before insertion.
CREATE POLICY "Allow users to insert their own divination logs" ON public.divinations FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Policy 3: Allow users to delete their own divination logs (Optional).
-- Decide if users should be able to delete their history. If yes, enable this.
-- If history should be immutable for users, comment this policy out.
CREATE POLICY "Allow users to delete their own divination logs" ON public.divinations FOR DELETE USING (auth.uid () = user_id);

-- Policy 4: Disallow updates by default for authenticated users.
-- Log entries are typically append-only. Updates should only be done via service_role if necessary.
-- Note: A policy denying updates isn't strictly needed if no UPDATE policy is granted,
-- but explicitly denying can be clearer. Alternatively, just don't grant UPDATE permission.
-- CREATE POLICY "Disallow updates for authenticated users"
--     ON public.divinations
--     FOR UPDATE
--     USING (false); -- Effectively denies updates for non-service roles
-- Policy 5: Allow full access for users with the 'service_role'.
-- Essential for backend operations, analytics, or potential administrative corrections.
CREATE POLICY "Allow service_role full access" ON public.divinations FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
USING (auth.role () = 'service_role')
WITH
    CHECK (auth.role () = 'service_role');

-- ** Step 6: Grant Permissions **
-- Grant necessary permissions to the 'authenticated' role based on the RLS policies.
-- Grant SELECT and INSERT. Grant DELETE only if Policy 3 is enabled.
GRANT
SELECT
,
    INSERT ON TABLE public.divinations TO authenticated;

-- GRANT DELETE ON TABLE public.divinations TO authenticated; -- Uncomment if users can delete history
-- Grant necessary permissions to the 'service_role'.
GRANT ALL ON TABLE public.divinations TO service_role;

GRANT USAGE ON SEQUENCE public.divinations_id_seq TO service_role;

-- If allowing authenticated users to insert:
GRANT USAGE ON SEQUENCE public.divinations_id_seq TO authenticated;

-- ============================================================
-- End of Script for 'divinations'
-- ============================================================