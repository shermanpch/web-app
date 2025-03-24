-- ========================================
-- User Readings Table Creation Script
-- ========================================
-- Create the user_readings table
CREATE TABLE
    IF NOT EXISTS user_readings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        first_number INTEGER NOT NULL,
        second_number INTEGER NOT NULL,
        third_number INTEGER NOT NULL,
        language TEXT NOT NULL DEFAULT 'English',
        prediction JSONB,
        clarifying_question TEXT,
        clarifying_answer TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );

-- ========================================
-- Row Level Security (RLS) Setup
-- ========================================
-- Enable Row Level Security (RLS) on user_readings
ALTER TABLE user_readings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read only their own readings
CREATE POLICY "Allow users to read their own readings" ON user_readings FOR
SELECT
    USING (auth.uid () = user_id);

-- Policy: Allow users to update only their own readings
CREATE POLICY "Allow users to update their own readings" ON user_readings FOR
UPDATE USING (auth.uid () = user_id);

-- Policy: Allow authenticated users to insert their own readings
CREATE POLICY "Allow authenticated users to insert their own readings" ON user_readings FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role full access" ON user_readings FOR ALL USING (auth.role () = 'service_role');