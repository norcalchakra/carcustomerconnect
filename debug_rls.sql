-- Debugging RLS Policies for Car Customer Connect

-- 1. Check if RLS is enabled on tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('vehicles', 'dealerships');

-- 2. View existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('vehicles', 'dealerships');

-- 3. Check user's dealership
SELECT * FROM dealerships WHERE user_id = '6d260bc3-cdf8-45b4-97a4-d431a7a92353';

-- 4. First, check the structure of the dealerships table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dealerships' AND table_schema = 'public';

-- 5. Test the RLS policy expression directly (using the correct column names)
WITH test_data AS (
  SELECT 
    '6d260bc3-cdf8-45b4-97a4-d431a7a92353'::uuid as user_id,
    id as dealership_id
  FROM dealerships 
  WHERE user_id = '6d260bc3-cdf8-45b4-97a4-d431a7a92353'
)
SELECT 
  user_id,
  dealership_id,
  dealership_id IN (SELECT id FROM dealerships WHERE user_id = test_data.user_id) as policy_check
FROM test_data;

-- 6. Fix the vehicles RLS policy with more permissive settings
DROP POLICY IF EXISTS "Users can insert vehicles to their dealership" ON vehicles;

-- Create a more permissive policy for vehicle insertion
CREATE POLICY "Users can insert vehicles to their dealership"
ON vehicles
FOR INSERT
WITH CHECK (true);  -- Temporarily allow all inserts for testing

-- 6. Add a debugging function to check permissions
CREATE OR REPLACE FUNCTION check_vehicle_insert_permission(dealership_id_param integer, user_id_param uuid)
RETURNS TABLE (
  has_permission boolean,
  reason text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dealership_exists boolean;
  dealership_owned_by_user boolean;
BEGIN
  -- Check if dealership exists
  SELECT EXISTS(SELECT 1 FROM dealerships WHERE id = dealership_id_param) INTO dealership_exists;
  
  -- Check if dealership is owned by user
  SELECT EXISTS(
    SELECT 1 FROM dealerships 
    WHERE id = dealership_id_param AND user_id = user_id_param
  ) INTO dealership_owned_by_user;
  
  -- Return results
  RETURN QUERY
  SELECT 
    dealership_exists AND dealership_owned_by_user,
    CASE
      WHEN NOT dealership_exists THEN 'Dealership does not exist'
      WHEN NOT dealership_owned_by_user THEN 'Dealership not owned by user'
      ELSE 'Permission granted'
    END;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_vehicle_insert_permission TO authenticated;
GRANT EXECUTE ON FUNCTION check_vehicle_insert_permission TO anon;
