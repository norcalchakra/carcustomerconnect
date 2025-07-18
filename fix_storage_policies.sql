-- Update the public access policy to ensure it works correctly
-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;

-- Create a more permissive public access policy
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'social-media-images');

-- Make sure the bucket is set to public
UPDATE storage.buckets
SET public = true
WHERE name = 'social-media-images';

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
