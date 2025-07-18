-- Comprehensive fix for Supabase storage issues
-- This script addresses all permission and configuration issues for the social-media-images bucket

-- 1. Ensure the bucket exists and is set to public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'social-media-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social-media-images', 'social-media-images', true);
  ELSE
    -- Make sure the bucket is set to public
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'social-media-images';
  END IF;
END $$;

-- 2. Drop all existing policies to avoid conflicts
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
    WHERE policyname = 'Allow public access to social media images' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Allow public access to social media images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow authenticated users to download images' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Allow authenticated users to download images" ON storage.objects;
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

-- 3. Create new policies with proper permissions

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'social-media-images');

-- Allow authenticated users to view all images
CREATE POLICY "Allow authenticated users to view images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'social-media-images');

-- Allow public access to view images (critical for social media previews)
CREATE POLICY "Allow public access to social media images"
ON storage.objects
FOR SELECT
TO public
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

-- 4. Verify the configuration

-- Verify the bucket settings
SELECT id, name, public FROM storage.buckets WHERE name = 'social-media-images';

-- List the policies for the bucket
SELECT policyname, permissive, roles, cmd, tablename, schemaname
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check if any objects exist in the bucket
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'social-media-images';

-- List some recent objects in the bucket (limit 5)
SELECT name, created_at, metadata FROM storage.objects 
WHERE bucket_id = 'social-media-images' 
ORDER BY created_at DESC 
LIMIT 5;
