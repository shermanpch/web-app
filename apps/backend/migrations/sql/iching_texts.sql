-- ========================================
-- I Ching Texts Table Creation Script
-- ========================================
-- Create the iching_texts table
CREATE TABLE
    IF NOT EXISTS iching_texts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        parent_coord TEXT NOT NULL,
        child_coord TEXT NOT NULL,
        parent_text TEXT,
        child_text TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            UNIQUE (parent_coord, child_coord)
    );

-- ========================================
-- Row Level Security (RLS) Setup
-- ========================================
-- Enable Row Level Security (RLS) on iching_texts
ALTER TABLE iching_texts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read texts
CREATE POLICY "Allow authenticated users to read texts" ON iching_texts FOR
SELECT
    USING (auth.uid () IS NOT NULL);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role full access" ON iching_texts FOR ALL USING (auth.role () = 'service_role');

-- ========================================
-- Indexes
-- ========================================
-- Create an index for faster lookups based on coordinates
CREATE INDEX IF NOT EXISTS idx_iching_coords ON iching_texts (parent_coord, child_coord);