-- ========================================
-- User Quotas Table Creation Script
-- ========================================
-- Create the user_quotas table
CREATE TABLE
    IF NOT EXISTS user_quotas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
        membership_type TEXT NOT NULL DEFAULT 'free',
        remaining_queries INTEGER NOT NULL CHECK (remaining_queries >= 0),
        premium_expires_at TIMESTAMP
        WITH
            TIME ZONE NULL,
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            UNIQUE (user_id)
    );

-- ========================================
-- Row Level Security (RLS) Setup
-- ========================================
-- Enable Row Level Security (RLS) on user_quotas
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read only their own quota
CREATE POLICY "Allow users to read their own quota" ON user_quotas FOR
SELECT
    USING (auth.uid () = user_id);

-- Policy: Allow users to update only their own quota
CREATE POLICY "Allow users to update their own quota" ON user_quotas FOR
UPDATE USING (auth.uid () = user_id);

-- Policy: Allow authenticated users to insert into user_quotas
CREATE POLICY "Allow authenticated users to insert into user_quotas" ON user_quotas FOR INSERT
WITH
    CHECK (auth.uid () IS NOT NULL);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role full access" ON user_quotas FOR ALL USING (auth.role () = 'service_role');