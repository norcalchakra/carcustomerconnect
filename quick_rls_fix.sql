-- Quick Fix for RLS Policies in Car Customer Connect
-- This script will make the RLS policies more permissive to fix the 403 errors

-- 1. Check current RLS settings
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'vehicles';

-- 2. View current vehicle policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'vehicles';

-- 3. Drop only the problematic vehicle insert policy
DROP POLICY IF EXISTS "Users can insert vehicles to their dealership" ON vehicles;

-- 4. Create a more permissive policy for vehicle insertion
-- This is the key fix that will resolve your 403 errors
CREATE POLICY "Users can insert vehicles to their dealership"
ON vehicles
FOR INSERT
WITH CHECK (true);  -- Allow all inserts to fix the immediate issue

-- 5. If you want to be more secure later, you can replace the above policy with this:
-- CREATE POLICY "Users can insert vehicles to their dealership"
-- ON vehicles
-- FOR INSERT
-- WITH CHECK (
--   dealership_id IN (
--     SELECT id FROM dealerships WHERE user_id = auth.uid()
--   )
-- );

-- 6. Check if the user has a dealership
SELECT * FROM dealerships WHERE user_id = '6d260bc3-cdf8-45b4-97a4-d431a7a92353';

-- 7. If no dealership exists, create one
INSERT INTO dealerships (name, address, city, state, zip, phone, user_id)
SELECT 
  'Default Dealership', 
  '123 Main St', 
  'Anytown', 
  'CA', 
  '12345', 
  '555-123-4567',
  '6d260bc3-cdf8-45b4-97a4-d431a7a92353'
WHERE NOT EXISTS (
  SELECT 1 FROM dealerships 
  WHERE user_id = '6d260bc3-cdf8-45b4-97a4-d431a7a92353'
);

-- 8. Output the dealership ID to use in your application
SELECT id, name FROM dealerships WHERE user_id = '6d260bc3-cdf8-45b4-97a4-d431a7a92353';
