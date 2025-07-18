-- Migration script to add new columns to social_posts table
-- This script safely adds new features without recreating existing policies

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add content_summary column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'social_posts' AND column_name = 'content_summary') THEN
        ALTER TABLE social_posts ADD COLUMN content_summary VARCHAR(150);
    END IF;

    -- Add post_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'social_posts' AND column_name = 'post_url') THEN
        ALTER TABLE social_posts ADD COLUMN post_url VARCHAR(500);
    END IF;

    -- Add engagement column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'social_posts' AND column_name = 'engagement') THEN
        ALTER TABLE social_posts ADD COLUMN engagement JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add new index for status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'social_posts_status_idx') THEN
        CREATE INDEX social_posts_status_idx ON social_posts(status);
    END IF;
END $$;

-- Create function to generate content_summary
CREATE OR REPLACE FUNCTION generate_content_summary() RETURNS TRIGGER AS $$
BEGIN
    -- Generate summary from content (first 100 chars + ellipsis if longer)
    IF NEW.content IS NOT NULL THEN
        IF LENGTH(NEW.content) > 100 THEN
            NEW.content_summary := LEFT(NEW.content, 100) || '...';
        ELSE
            NEW.content_summary := NEW.content;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS generate_content_summary_trigger ON social_posts;
CREATE TRIGGER generate_content_summary_trigger
BEFORE INSERT OR UPDATE OF content ON social_posts
FOR EACH ROW
EXECUTE FUNCTION generate_content_summary();

-- Update existing records to generate content_summary
UPDATE social_posts
SET content_summary = 
    CASE 
        WHEN LENGTH(content) > 100 THEN LEFT(content, 100) || '...'
        ELSE content
    END
WHERE content_summary IS NULL;

-- Create dashboard_activity view for combined activity feed
CREATE OR REPLACE VIEW dashboard_activity AS
-- Vehicle events (non-social posts)
SELECT 
    ve.id,
    ve.created_at,
    've' AS source_type,
    ve.event_type,
    ve.notes,
    ve.vehicle_id,
    v.year,
    v.make,
    v.model,
    v.vin,
    v.stock_number,
    v.dealership_id,
    NULL::varchar(150) AS content_summary,
    NULL::varchar(500) AS post_url,
    NULL::text[] AS image_urls,
    NULL::jsonb AS engagement,
    NULL::varchar(50) AS platform
FROM 
    vehicle_events ve
JOIN 
    vehicles v ON ve.vehicle_id = v.id
WHERE 
    ve.event_type != 'social_post'

UNION ALL

-- Social posts
SELECT 
    sp.id,
    sp.created_at,
    'sp' AS source_type,
    'social_post' AS event_type,
    sp.content AS notes,
    sp.vehicle_id,
    v.year,
    v.make,
    v.model,
    v.vin,
    v.stock_number,
    sp.dealership_id,
    sp.content_summary,
    sp.post_url,
    sp.image_urls,
    sp.engagement,
    sp.platform
FROM 
    social_posts sp
LEFT JOIN 
    vehicles v ON sp.vehicle_id = v.id;

-- Grant permissions on the view
GRANT SELECT ON dashboard_activity TO authenticated;
GRANT SELECT ON dashboard_activity TO service_role;

-- Add comment to explain the migration
COMMENT ON TABLE social_posts IS 'Table for social media posts with enhanced fields for content summary, post URL, and engagement metrics';
