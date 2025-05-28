-- ============================================================
-- Script to Create/Reset the 'membership_feature_quota' Table
-- ============================================================
-- Purpose: Defines the weekly usage quota for each feature based on membership tier.
-- Idempotent: Yes - Drops existing table and its dependent objects (like policies)
--          before recreating.
-- WARNING: Dropping the table with CASCADE might affect other objects if they
--          were made dependent on it, though typically this is a leaf configuration table.
-- Requires: The 'membership_tiers' and 'features' tables must exist and be seeded.
-- ============================================================
-- ** Step 1: Drop Existing Table (and automatically drop dependent policies/constraints) **
-- Use CASCADE to remove dependencies cleanly.
DROP TABLE IF EXISTS public.membership_feature_quota CASCADE;

-- ** Step 2: Create the 'membership_feature_quota' Table **
CREATE TABLE
    public.membership_feature_quota (
        -- Foreign key to the membership_tiers table. Part of the composite primary key.
        membership_tier_id INT NOT NULL REFERENCES public.membership_tiers (id) ON DELETE CASCADE,
        -- Foreign key to the features table. Part of the composite primary key.
        feature_id INT NOT NULL REFERENCES public.features (id) ON DELETE CASCADE,
        -- The number of times this feature can be used per week for this tier.
        -- NULL can represent 'unlimited' usage.
        weekly_quota INT NULL CHECK (
            weekly_quota IS NULL
            OR weekly_quota >= 0
        ), -- Allow NULL or non-negative integers
        -- Timestamp when this quota rule was created or last updated.
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        -- Define the composite primary key to ensure uniqueness for each tier-feature pair.
        PRIMARY KEY (membership_tier_id, feature_id)
    );

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.membership_feature_quota IS 'Maps membership tiers to features and defines their weekly usage quotas.';

COMMENT ON COLUMN public.membership_feature_quota.membership_tier_id IS 'Foreign key referencing the membership tier.';

COMMENT ON COLUMN public.membership_feature_quota.feature_id IS 'Foreign key referencing the feature.';

COMMENT ON COLUMN public.membership_feature_quota.weekly_quota IS 'Weekly usage limit for the feature within this tier (NULL for unlimited).';

COMMENT ON COLUMN public.membership_feature_quota.created_at IS 'Timestamp when the quota rule was created.';

-- ** Step 3: Create Indexes (Optional but potentially useful) **
-- The composite primary key already creates an index on (membership_tier_id, feature_id).
-- You might add individual indexes if you frequently query only by tier_id or feature_id.
-- CREATE INDEX IF NOT EXISTS idx_mfq_membership_tier_id ON public.membership_feature_quota(membership_tier_id);
-- CREATE INDEX IF NOT EXISTS idx_mfq_feature_id ON public.membership_feature_quota(feature_id);
-- ** Step 4: Enable Row Level Security (RLS) **
ALTER TABLE public.membership_feature_quota ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE public.membership_feature_quota FORCE ROW LEVEL SECURITY;

-- ** Step 5: Create RLS Policies **
-- Policies are automatically dropped by `DROP TABLE ... CASCADE`, so we just recreate them.
-- Policy 1: Allow authenticated users to read all quota rules.
-- Quota configurations are generally needed by the application logic for any user.
CREATE POLICY "Allow authenticated users to read quota rules" ON public.membership_feature_quota FOR
SELECT
    USING (auth.role () = 'authenticated');

-- Checks if the user is logged in
-- Policy 2: Allow full access for users with the 'service_role'.
-- Essential for backend/admin to manage quota configurations.
CREATE POLICY "Allow service_role full access" ON public.membership_feature_quota FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
USING (auth.role () = 'service_role')
WITH
    CHECK (auth.role () = 'service_role');

-- ** Step 6: Seed Initial Data **
-- Insert the quota rules based on the requirements.
-- Uses subqueries to get the correct IDs for tiers and features by name.
-- ON CONFLICT DO UPDATE ensures that if the script is re-run, existing rules are updated
-- with the specified quotas, rather than causing an error or doing nothing.
-- Free Tier Quotas
INSERT INTO
    public.membership_feature_quota (membership_tier_id, feature_id, weekly_quota)
VALUES
    (
        (
            SELECT
                id
            FROM
                public.membership_tiers
            WHERE
                name = 'free'
        ),
        (
            SELECT
                id
            FROM
                public.features
            WHERE
                name = 'basic_divination'
        ),
        10
    ),
    (
        (
            SELECT
                id
            FROM
                public.membership_tiers
            WHERE
                name = 'free'
        ),
        (
            SELECT
                id
            FROM
                public.features
            WHERE
                name = 'premium_divination'
        ),
        3
    ) ON CONFLICT (membership_tier_id, feature_id) DO
UPDATE
SET
    weekly_quota = EXCLUDED.weekly_quota,
    created_at = NOW ();

-- Optionally update created_at, or leave it
-- Premium Tier Quotas
INSERT INTO
    public.membership_feature_quota (membership_tier_id, feature_id, weekly_quota)
VALUES
    (
        (
            SELECT
                id
            FROM
                public.membership_tiers
            WHERE
                name = 'premium'
        ),
        (
            SELECT
                id
            FROM
                public.features
            WHERE
                name = 'basic_divination'
        ),
        NULL
    ), -- NULL for unlimited
    (
        (
            SELECT
                id
            FROM
                public.membership_tiers
            WHERE
                name = 'premium'
        ),
        (
            SELECT
                id
            FROM
                public.features
            WHERE
                name = 'premium_divination'
        ),
        10
    ) ON CONFLICT (membership_tier_id, feature_id) DO
UPDATE
SET
    weekly_quota = EXCLUDED.weekly_quota,
    created_at = NOW ();

-- Optionally update created_at
-- ** Step 7: Grant Permissions **
-- Grant SELECT permission to the 'authenticated' role.
GRANT
SELECT
    ON TABLE public.membership_feature_quota TO authenticated;

-- Grant necessary permissions to the 'service_role'.
GRANT ALL ON TABLE public.membership_feature_quota TO service_role;

-- ============================================================
-- End of Script for 'membership_feature_quota'
-- ============================================================