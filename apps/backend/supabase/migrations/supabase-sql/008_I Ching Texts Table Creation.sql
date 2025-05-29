-- ============================================================
-- Script to Create/Reset the 'iching_texts' Table
-- ============================================================
-- Purpose: Stores the static I Ching text content (parent and child hexagram texts)
--          associated with specific coordinate pairs (e.g., '1-1', '2').
-- Idempotent: Yes - Drops existing table and its dependent objects (like policies)
--          before recreating.
-- WARNING: Dropping this table will permanently delete all stored I Ching texts.
--          You will need to re-run your migration script (migrate_to_supabase.py)
--          to repopulate it.
-- ============================================================
-- ** Step 1: Drop Existing Table (and automatically drop dependent policies/constraints) **
-- Use CASCADE to remove dependencies cleanly.
DROP TABLE IF EXISTS public.iching_texts CASCADE;

-- ** Step 2: Create the 'iching_texts' Table **
CREATE TABLE
    public.iching_texts (
        -- Unique identifier for the text entry. Using UUID is standard.
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        -- The coordinate representing the parent hexagram (e.g., '1-1', '7-3').
        parent_coord TEXT NOT NULL,
        -- The coordinate representing the child hexagram/changing line (e.g., '0', '5').
        child_coord TEXT NOT NULL,
        -- The descriptive text associated with the parent hexagram coordinate.
        parent_json JSONB NULL,
        -- The descriptive text associated with the child hexagram/changing line coordinate.
        child_json JSONB NULL,
        -- Timestamp when this text entry was created or last updated (e.g., by migration).
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        -- Ensure that each combination of parent and child coordinates is unique.
        UNIQUE (parent_coord, child_coord)
    );

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.iching_texts IS 'Stores static I Ching text content for parent and child hexagram coordinates.';

COMMENT ON COLUMN public.iching_texts.id IS 'Primary key for the I Ching text entry.';

COMMENT ON COLUMN public.iching_texts.parent_coord IS 'Coordinate string for the parent hexagram (e.g., ''1-1'').';

COMMENT ON COLUMN public.iching_texts.child_coord IS 'Coordinate string for the child hexagram/line (e.g., ''2'').';

COMMENT ON COLUMN public.iching_texts.parent_json IS 'Json content associated with the parent hexagram.';

COMMENT ON COLUMN public.iching_texts.child_json IS 'Json content associated with the child hexagram/line.';

COMMENT ON COLUMN public.iching_texts.created_at IS 'Timestamp when the text entry was created/updated.';

-- ** Step 3: Create Indexes **
-- Index on the unique coordinate pair for fast lookups when retrieving text.
-- The UNIQUE constraint already creates an index, but explicitly naming it is fine.
CREATE INDEX IF NOT EXISTS idx_iching_texts_coords ON public.iching_texts (parent_coord, child_coord);

-- ** Step 4: Enable Row Level Security (RLS) **
ALTER TABLE public.iching_texts ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE public.iching_texts FORCE ROW LEVEL SECURITY;

-- ** Step 5: Create RLS Policies **
-- Policies are automatically dropped by `DROP TABLE ... CASCADE`, so we just recreate them.
-- Policy 1: Allow authenticated users to read all I Ching texts.
-- This data is static and needed by the application logic for any logged-in user generating a reading.
CREATE POLICY "Allow authenticated users to read texts" ON public.iching_texts FOR
SELECT
    USING (auth.role () = 'authenticated');

-- Checks if the user is logged in
-- Policy 2: Allow full access for users with the 'service_role'.
-- Essential for the migration script (migrate_to_supabase.py) and any admin tasks.
CREATE POLICY "Allow service_role full access" ON public.iching_texts FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
USING (auth.role () = 'service_role')
WITH
    CHECK (auth.role () = 'service_role');

-- ** Step 6: Grant Permissions **
-- Grant SELECT permission to the 'authenticated' role.
GRANT
SELECT
    ON TABLE public.iching_texts TO authenticated;

-- Grant necessary permissions to the 'service_role'.
GRANT ALL ON TABLE public.iching_texts TO service_role;

-- ============================================================
-- End of Script for 'iching_texts'
-- ============================================================
-- Reminder: After running this script, you need to run your
--           `supabase/migrations/scripts/migrate_to_supabase.py
--           script again to populate this table with data.
-- ============================================================