-- Check captions table structure and RLS policies
SELECT table_name, is_insertable_into 
FROM information_schema.tables 
WHERE table_name = 'captions';

-- Check existing RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'captions';

-- Check if the captions table exists and its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'captions';

-- Check if there are any captions in the table
SELECT COUNT(*) FROM captions;

-- Check if event_id 11 exists in vehicle_events table
SELECT EXISTS(SELECT 1 FROM vehicle_events WHERE id = 11);

-- Check if the user has access to the vehicle associated with event_id 11
SELECT v.id, v.dealership_id, d.user_id = auth.uid() as has_access
FROM vehicle_events e
JOIN vehicles v ON e.vehicle_id = v.id
JOIN dealerships d ON v.dealership_id = d.id
WHERE e.id = 11;
