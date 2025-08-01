-- Fix RLS policy for user_social_accounts table to allow Facebook page saving
-- This addresses the 403 error when saving Facebook pages

-- First, check if the table exists and create it if it doesn't
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_social_accounts') THEN
        CREATE TABLE user_social_accounts (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            platform VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'google'
            platform_user_id VARCHAR(255) NOT NULL,
            platform_username VARCHAR(255),
            access_token TEXT,
            refresh_token TEXT,
            expires_at TIMESTAMP WITH TIME ZONE,
            page_id VARCHAR(255), -- For Facebook pages
            page_name VARCHAR(255), -- For Facebook pages
            page_access_token TEXT, -- For Facebook pages
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, platform, platform_user_id)
        );
        
        -- Enable RLS
        ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_social_accounts_select_policy ON user_social_accounts;
DROP POLICY IF EXISTS user_social_accounts_insert_policy ON user_social_accounts;
DROP POLICY IF EXISTS user_social_accounts_update_policy ON user_social_accounts;
DROP POLICY IF EXISTS user_social_accounts_delete_policy ON user_social_accounts;

-- Create permissive RLS policies for user_social_accounts
CREATE POLICY user_social_accounts_select_policy ON user_social_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_social_accounts_insert_policy ON user_social_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_social_accounts_update_policy ON user_social_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_social_accounts_delete_policy ON user_social_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_social_accounts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_social_accounts_id_seq TO authenticated;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_platform 
ON user_social_accounts(user_id, platform);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_social_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS user_social_accounts_updated_at_trigger ON user_social_accounts;
CREATE TRIGGER user_social_accounts_updated_at_trigger
    BEFORE UPDATE ON user_social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_social_accounts_updated_at();
