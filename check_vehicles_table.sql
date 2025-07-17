-- Check the structure of the vehicles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicles' AND table_schema = 'public';

-- Check if any vehicles exist
SELECT COUNT(*) FROM vehicles;

-- Check if the user has a dealership
SELECT * FROM dealerships WHERE user_id = '6d260bc3-cdf8-45b4-97a4-d431a7a92353';

-- Check the RLS policy for vehicles insertion
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'vehicles' AND cmd = 'INSERT';
