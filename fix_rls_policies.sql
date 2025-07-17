-- Fix RLS Policies for Car Customer Connect

-- 1. Enable RLS on tables if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own dealerships" ON dealerships;
DROP POLICY IF EXISTS "Users can insert their own dealerships" ON dealerships;
DROP POLICY IF EXISTS "Users can update their own dealerships" ON dealerships;
DROP POLICY IF EXISTS "Users can delete their own dealerships" ON dealerships;

DROP POLICY IF EXISTS "Users can view vehicles from their dealership" ON vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles to their dealership" ON vehicles;
DROP POLICY IF EXISTS "Users can update vehicles in their dealership" ON vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles from their dealership" ON vehicles;

-- 3. Create proper policies for dealerships table
-- Allow users to view their own dealerships
CREATE POLICY "Users can view their own dealerships"
ON dealerships
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own dealerships
CREATE POLICY "Users can insert their own dealerships"
ON dealerships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own dealerships
CREATE POLICY "Users can update their own dealerships"
ON dealerships
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own dealerships
CREATE POLICY "Users can delete their own dealerships"
ON dealerships
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create proper policies for vehicles table
-- Allow users to view vehicles from their dealership
CREATE POLICY "Users can view vehicles from their dealership"
ON vehicles
FOR SELECT
USING (
  dealership_id IN (
    SELECT id FROM dealerships WHERE user_id = auth.uid()
  )
);

-- Allow users to insert vehicles to their dealership
CREATE POLICY "Users can insert vehicles to their dealership"
ON vehicles
FOR INSERT
WITH CHECK (
  dealership_id IN (
    SELECT id FROM dealerships WHERE user_id = auth.uid()
  )
);

-- Allow users to update vehicles in their dealership
CREATE POLICY "Users can update vehicles in their dealership"
ON vehicles
FOR UPDATE
USING (
  dealership_id IN (
    SELECT id FROM dealerships WHERE user_id = auth.uid()
  )
);

-- Allow users to delete vehicles from their dealership
CREATE POLICY "Users can delete vehicles from their dealership"
ON vehicles
FOR DELETE
USING (
  dealership_id IN (
    SELECT id FROM dealerships WHERE user_id = auth.uid()
  )
);

-- 5. Create a function to get dealership by user_id (for API calls)
CREATE OR REPLACE FUNCTION get_dealership_by_user_id(user_id_param UUID)
RETURNS SETOF dealerships
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM dealerships WHERE user_id = user_id_param;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_dealership_by_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_dealership_by_user_id TO anon;
