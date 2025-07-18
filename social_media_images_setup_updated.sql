-- Check if the bucket exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'social-media-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social-media-images', 'social-media-images', true);
  END IF;
END $$;

-- Set up storage policies for the social-media-images bucket
-- First, check if policies already exist and drop them if they do
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow authenticated users to upload images' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Allow authenticated users to upload images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow authenticated users to view their dealership images' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Allow authenticated users to view their dealership images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow public to view images' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Allow public to view images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow authenticated users to delete their dealership images' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Allow authenticated users to delete their dealership images" ON storage.objects;
  END IF;
END $$;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media-images' AND
  (storage.foldername(name))[1] = 'dealership-' || (
    SELECT dealerships.id::text
    FROM dealerships
    WHERE dealerships.user_id = auth.uid()
    LIMIT 1
  )
);

-- Allow authenticated users to select their own dealership's images
CREATE POLICY "Allow authenticated users to view their dealership images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'social-media-images' AND
  (storage.foldername(name))[1] = 'dealership-' || (
    SELECT dealerships.id::text
    FROM dealerships
    WHERE dealerships.user_id = auth.uid()
    LIMIT 1
  )
);

-- Allow public access to read images (needed for social media previews)
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'social-media-images');

-- Allow authenticated users to delete their own dealership's images
CREATE POLICY "Allow authenticated users to delete their dealership images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media-images' AND
  (storage.foldername(name))[1] = 'dealership-' || (
    SELECT dealerships.id::text
    FROM dealerships
    WHERE dealerships.user_id = auth.uid()
    LIMIT 1
  )
);

-- Ensure the social_posts table has the proper structure for image URLs
-- Check if image_urls column exists and is of the correct type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'image_urls'
  ) THEN
    -- Add image_urls column if it doesn't exist
    ALTER TABLE social_posts ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  ELSIF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'image_urls'
  ) != 'ARRAY' THEN
    -- Convert to array type if it's not already
    ALTER TABLE social_posts 
    ALTER COLUMN image_urls TYPE TEXT[] USING 
      CASE 
        WHEN image_urls IS NULL THEN '{}'::TEXT[]
        WHEN image_urls = '' THEN '{}'::TEXT[]
        ELSE ARRAY[image_urls]
      END;
  END IF;
END $$;

-- Create image_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.image_usage (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  dealership_id INTEGER REFERENCES public.dealerships(id),
  vehicle_id INTEGER REFERENCES public.vehicles(id),
  usage_type TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(image_url, dealership_id, usage_type)
);

-- Add RLS policies for image_usage table
ALTER TABLE public.image_usage ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view their dealership''s image usage' 
    AND tablename = 'image_usage'
  ) THEN
    -- Policy to allow users to select their own dealership's image usage data
    CREATE POLICY "Users can view their dealership's image usage"
    ON public.image_usage
    FOR SELECT
    TO authenticated
    USING (
      dealership_id IN (
        SELECT id FROM public.dealerships
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Create or replace the track_image_usage function
CREATE OR REPLACE FUNCTION public.track_image_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record into image_usage table
  INSERT INTO public.image_usage (image_url, dealership_id, vehicle_id, usage_type)
  SELECT 
    unnest(NEW.image_urls), 
    NEW.dealership_id, 
    NEW.vehicle_id, 
    'social_post'
  ON CONFLICT (image_url, dealership_id, usage_type) 
  DO UPDATE SET 
    usage_count = public.image_usage.usage_count + 1,
    last_used = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists and create a new one
DROP TRIGGER IF EXISTS track_social_post_images ON public.social_posts;
CREATE TRIGGER track_social_post_images
AFTER INSERT OR UPDATE OF image_urls ON public.social_posts
FOR EACH ROW
WHEN (NEW.image_urls IS NOT NULL AND array_length(NEW.image_urls, 1) > 0)
EXECUTE FUNCTION public.track_image_usage();

-- Add a function to clean up unused images (optional, can be scheduled to run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_unused_images(days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (deleted_path TEXT) AS $$
DECLARE
  bucket_name TEXT := 'social-media-images';
BEGIN
  RETURN QUERY
  WITH unused_images AS (
    SELECT objects.name
    FROM storage.objects
    LEFT JOIN public.image_usage
      ON storage.url_decode(objects.name) = image_usage.image_url
    WHERE 
      objects.bucket_id = bucket_name AND
      image_usage.id IS NULL AND
      objects.created_at < NOW() - (days_threshold || ' days')::INTERVAL
  )
  SELECT name
  FROM unused_images
  WHERE storage.delete_object(bucket_name, name) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
