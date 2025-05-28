-- ============================================================
-- Script to Create/Reset the 'user_readings' Table
-- ============================================================
-- Purpose: Stores the detailed content and results of user divination readings
--          for display in their history. This table is distinct from the
--          'divinations' table used for quota tracking.
-- Idempotent: Yes - Drops existing table and its dependent objects (like policies)
--          before recreating.
-- WARNING: Dropping this table will permanently delete all saved reading history.
-- Requires: The 'public.profiles' table must exist (or 'auth.users' if linking directly).
-- ============================================================
-- ** Step 1: Drop Existing Table (and automatically drop dependent policies/constraints) **
-- Use CASCADE to remove dependencies cleanly.
DROP TABLE IF EXISTS public.user_readings CASCADE;

-- ** Step 2: Create the 'user_readings' Table **
CREATE TABLE
    public.user_readings (
        -- Unique identifier for the saved reading. Using UUID is good practice.
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        -- Foreign key to the user's profile. If the profile/user is deleted, these readings are removed.
        -- Linking to 'profiles' is recommended for consistency with the 'divinations' table.
        user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
        -- The question the user asked for this reading.
        question TEXT NOT NULL,
        -- The reading mode (basic or deep_dive)
        mode TEXT NOT NULL DEFAULT 'basic',
        -- The language the reading was generated in.
        language TEXT NOT NULL DEFAULT 'English',
        -- The input numbers used for the divination.
        first_number INT NOT NULL,
        second_number INT NOT NULL,
        third_number INT NOT NULL,
        -- The detailed prediction result, stored as JSONB.
        -- Includes hexagram names, interpretations, advice, etc.
        prediction JSONB NULL,
        -- Follow-up question asked by the user, if any.
        clarifying_question TEXT NULL,
        -- Answer provided for the follow-up question, if any.
        clarifying_answer TEXT NULL,
        -- Timestamp when the reading was saved. Defaults to the time of insertion.
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.user_readings IS 'Stores detailed content of user divination readings for history display.';

COMMENT ON COLUMN public.user_readings.id IS 'Primary key for the saved reading entry.';

COMMENT ON COLUMN public.user_readings.user_id IS 'Foreign key referencing the user who owns this reading.';

COMMENT ON COLUMN public.user_readings.question IS 'The question asked by the user.';

COMMENT ON COLUMN public.user_readings.mode IS 'Reading mode (basic or deep_dive).';

COMMENT ON COLUMN public.user_readings.language IS 'Language of the reading interpretation.';

COMMENT ON COLUMN public.user_readings.first_number IS 'First input number for the divination.';

COMMENT ON COLUMN public.user_readings.second_number IS 'Second input number for the divination.';

COMMENT ON COLUMN public.user_readings.third_number IS 'Third input number for the divination.';

COMMENT ON COLUMN public.user_readings.prediction IS 'JSONB storing the detailed prediction object.';

COMMENT ON COLUMN public.user_readings.clarifying_question IS 'User''s follow-up clarification question, if any.';

COMMENT ON COLUMN public.user_readings.clarifying_answer IS 'AI''s answer to the clarification question, if any.';

COMMENT ON COLUMN public.user_readings.created_at IS 'Timestamp when the reading was saved.';

-- ** Step 3: Create Indexes **
-- Index on user_id is CRUCIAL for RLS performance and fetching a user's history.
CREATE INDEX IF NOT EXISTS idx_user_readings_user_id ON public.user_readings (user_id);

-- Index on created_at (especially combined with user_id) helps order history efficiently.
CREATE INDEX IF NOT EXISTS idx_user_readings_user_created ON public.user_readings (user_id, created_at DESC);

-- Optional: GIN index on 'prediction' or specific keys within it if you need to search history content.
-- CREATE INDEX IF NOT EXISTS idx_user_readings_prediction_gin ON public.user_readings USING GIN (prediction);
-- ** Step 4: Enable Row Level Security (RLS) **
ALTER TABLE public.user_readings ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE public.user_readings FORCE ROW LEVEL SECURITY;

-- ** Step 5: Create RLS Policies **
-- Policies are automatically dropped by `DROP TABLE ... CASCADE`, so we just recreate them.
-- Policy 1: Allow users to read their own saved readings.
CREATE POLICY "Allow users to read their own readings" ON public.user_readings FOR
SELECT
    USING (auth.uid () = user_id);

-- Policy 2: Allow users to insert their own readings.
CREATE POLICY "Allow users to insert their own readings" ON public.user_readings FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Policy 3: Allow users to delete their own readings.
-- This is the key difference from the 'divinations' table policy.
CREATE POLICY "Allow users to delete their own readings" ON public.user_readings FOR DELETE USING (auth.uid () = user_id);

-- Policy 4: Allow users to update their own readings (e.g., adding clarification).
-- Ensure backend logic validates which fields can be updated.
CREATE POLICY "Allow users to update their own readings" ON public.user_readings FOR
UPDATE USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- Policy 5: Allow full access for users with the 'service_role'.
CREATE POLICY "Allow service_role full access" ON public.user_readings FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
USING (auth.role () = 'service_role')
WITH
    CHECK (auth.role () = 'service_role');

-- ** Step 6: Grant Permissions **
-- Grant necessary permissions to the 'authenticated' role based on the RLS policies.
GRANT
SELECT
,
    INSERT,
UPDATE,
DELETE ON TABLE public.user_readings TO authenticated;

-- Grant necessary permissions to the 'service_role'.
GRANT ALL ON TABLE public.user_readings TO service_role;

-- ============================================================
-- End of Script for 'user_readings'
-- ============================================================