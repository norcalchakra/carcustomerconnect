-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id BIGINT NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for scheduled_posts table
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their dealership's scheduled posts
CREATE POLICY view_scheduled_posts ON scheduled_posts
  FOR SELECT
  USING (
    dealership_id IN (
      SELECT id FROM dealerships
      WHERE user_id = auth.uid()
    )
  );

-- Policy for users to insert their own scheduled posts
CREATE POLICY insert_scheduled_posts ON scheduled_posts
  FOR INSERT
  WITH CHECK (
    dealership_id IN (
      SELECT id FROM dealerships
      WHERE user_id = auth.uid()
    )
  );

-- Policy for users to update their own scheduled posts
CREATE POLICY update_scheduled_posts ON scheduled_posts
  FOR UPDATE
  USING (
    dealership_id IN (
      SELECT id FROM dealerships
      WHERE user_id = auth.uid()
    )
  );

-- Policy for users to delete their own scheduled posts
CREATE POLICY delete_scheduled_posts ON scheduled_posts
  FOR DELETE
  USING (
    dealership_id IN (
      SELECT id FROM dealerships
      WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create index for faster queries
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_dealership_id ON scheduled_posts(dealership_id);

-- Create view for upcoming scheduled posts
CREATE OR REPLACE VIEW upcoming_scheduled_posts AS
SELECT 
  sp.*,
  v.make,
  v.model,
  v.year,
  v.vin,
  v.stock_number,
  d.name as dealership_name
FROM 
  scheduled_posts sp
LEFT JOIN 
  vehicles v ON sp.vehicle_id = v.id
JOIN 
  dealerships d ON sp.dealership_id = d.id
WHERE 
  sp.status = 'pending'
  AND sp.scheduled_time > NOW()
ORDER BY 
  sp.scheduled_time ASC;

-- Comment on tables and columns
COMMENT ON TABLE scheduled_posts IS 'Stores scheduled social media posts';
COMMENT ON COLUMN scheduled_posts.id IS 'Unique identifier for the scheduled post';
COMMENT ON COLUMN scheduled_posts.user_id IS 'User who created the scheduled post';
COMMENT ON COLUMN scheduled_posts.dealership_id IS 'Dealership the post belongs to';
COMMENT ON COLUMN scheduled_posts.vehicle_id IS 'Optional vehicle associated with the post';
COMMENT ON COLUMN scheduled_posts.content IS 'Text content of the post';
COMMENT ON COLUMN scheduled_posts.image_urls IS 'Array of image URLs to include in the post';
COMMENT ON COLUMN scheduled_posts.platforms IS 'Array of social media platforms to post to';
COMMENT ON COLUMN scheduled_posts.scheduled_time IS 'When the post should be published';
COMMENT ON COLUMN scheduled_posts.status IS 'Current status of the scheduled post';
COMMENT ON COLUMN scheduled_posts.metadata IS 'Additional metadata for the post';
