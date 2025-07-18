-- Fix download permissions for social-media-images bucket
-- This script addresses issues with downloading images from Supabase storage

-- First, ensure the bucket is set to public
UPDATE storage.buckets
SET public = true
WHERE name = 'social-media-images';

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to social media images" ON storage.objects;

-- Create a more permissive public access policy with no path restrictions
CREATE POLICY "Allow public access to social media images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'social-media-images');

-- Ensure authenticated users can download their images
DROP POLICY IF EXISTS "Allow authenticated users to download images" ON storage.objects;
CREATE POLICY "Allow authenticated users to download images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'social-media-images');

-- Fix CORS issues by setting proper headers in the storage configuration
-- Note: This requires manual configuration in the Supabase dashboard
-- Go to Storage > Buckets > social-media-images > Settings
-- Set CORS configuration to:
/*
[
  {
    "origin": "*",
    "methods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "headers": ["*"],
    "expose_headers": ["Content-Length", "Content-Range"],
    "max_age": 86400
  }
]
*/

-- Verify the bucket settings
SELECT id, name, public FROM storage.buckets WHERE name = 'social-media-images';

-- List the policies for the bucket
SELECT policyname, permissive, roles, cmd, tablename, schemaname
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check if any objects exist in the bucket
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'social-media-images';

-- List some recent objects in the bucket (limit 5)
SELECT name, created_at FROM storage.objects 
WHERE bucket_id = 'social-media-images' 
ORDER BY created_at DESC 
LIMIT 5;
