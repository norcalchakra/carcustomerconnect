-- Migration: Add tables for Facebook data deletion compliance
-- Created: 2024-07-31

-- Table to track data deletion requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facebook_user_id TEXT NOT NULL,
    confirmation_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ERROR')),
    status_message TEXT,
    status_url TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store Facebook tokens and page connections
CREATE TABLE IF NOT EXISTS facebook_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facebook_user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'user',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store connected Facebook pages
CREATE TABLE IF NOT EXISTS facebook_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facebook_user_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    page_name TEXT NOT NULL,
    page_access_token TEXT NOT NULL,
    page_category TEXT,
    page_picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, page_id)
);

-- Table to cache Facebook user data
CREATE TABLE IF NOT EXISTS facebook_user_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facebook_user_id TEXT NOT NULL UNIQUE,
    facebook_name TEXT,
    facebook_email TEXT,
    facebook_picture_url TEXT,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add Facebook user ID to user profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'facebook_user_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN facebook_user_id TEXT UNIQUE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_facebook_user_id ON data_deletion_requests(facebook_user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_confirmation_code ON data_deletion_requests(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_facebook_tokens_user_id ON facebook_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_tokens_facebook_user_id ON facebook_tokens(facebook_user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_user_id ON facebook_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_facebook_user_id ON facebook_pages(facebook_user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_user_cache_facebook_user_id ON facebook_user_cache(facebook_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_facebook_user_id ON user_profiles(facebook_user_id);

-- Create RLS policies for security
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_user_cache ENABLE ROW LEVEL SECURITY;

-- Data deletion requests are managed by the system, no user access needed
CREATE POLICY "System can manage data deletion requests" ON data_deletion_requests
    FOR ALL USING (true);

-- Facebook tokens - users can only access their own
CREATE POLICY "Users can manage their own Facebook tokens" ON facebook_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Facebook pages - users can only access their own
CREATE POLICY "Users can manage their own Facebook pages" ON facebook_pages
    FOR ALL USING (auth.uid() = user_id);

-- Facebook user cache - users can only access their own
CREATE POLICY "Users can access their own Facebook cache" ON facebook_user_cache
    FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_data_deletion_requests_updated_at 
    BEFORE UPDATE ON data_deletion_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_tokens_updated_at 
    BEFORE UPDATE ON facebook_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_pages_updated_at 
    BEFORE UPDATE ON facebook_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired deletion requests (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_expired_deletion_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM data_deletion_requests 
    WHERE created_at < NOW() - INTERVAL '90 days' 
    AND status IN ('COMPLETED', 'ERROR');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired Facebook cache
CREATE OR REPLACE FUNCTION cleanup_expired_facebook_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM facebook_user_cache 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE data_deletion_requests IS 'Tracks Facebook data deletion requests for compliance';
COMMENT ON TABLE facebook_tokens IS 'Stores Facebook access tokens for users';
COMMENT ON TABLE facebook_pages IS 'Stores connected Facebook pages for users';
COMMENT ON TABLE facebook_user_cache IS 'Caches Facebook user data to reduce API calls';
