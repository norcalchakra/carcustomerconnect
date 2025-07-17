-- Check if event_id 11 exists in vehicle_events table
SELECT EXISTS(SELECT 1 FROM vehicle_events WHERE id = 11) as event_exists;

-- Check if there are any captions for event_id 11
SELECT COUNT(*) FROM captions WHERE event_id = 11;

-- Check the vehicle_events table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicle_events';

-- Check RLS on vehicle_events table
SELECT tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'vehicle_events';

-- Check if there are any constraints that might be causing issues
SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'captions'::regclass OR conrelid = 'vehicle_events'::regclass;

-- Check if the user has access to the vehicle associated with event_id 11
SELECT e.id as event_id, e.vehicle_id, v.dealership_id
FROM vehicle_events e
JOIN vehicles v ON e.vehicle_id = v.id
WHERE e.id = 11;

-- Check if there are any triggers on the captions table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'captions';
