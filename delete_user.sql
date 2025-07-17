-- SQL to delete a specific user and all related data in Supabase
-- WARNING: This will permanently delete the user and all associated data!

-- User ID to delete: 8701de7d-7307-4439-a16a-0c63d13e90b6
-- Email: andersen.chris@live.com

-- First, delete all related data in the public schema
-- Delete vehicles associated with the user's dealerships
DELETE FROM public.vehicles
WHERE dealership_id IN (
  SELECT id FROM public.dealerships
  WHERE user_id = '8701de7d-7307-4439-a16a-0c63d13e90b6'
);

-- Delete dealerships owned by the user
DELETE FROM public.dealerships
WHERE user_id = '8701de7d-7307-4439-a16a-0c63d13e90b6';

-- Finally, delete the user from the auth schema
DELETE FROM auth.users
WHERE id = '8701de7d-7307-4439-a16a-0c63d13e90b6';

-- Alternative: Delete by email
-- DELETE FROM auth.users
-- WHERE email = 'andersen.chris@live.com';

-- If the above doesn't work, you may need admin privileges
-- Try running this as a Supabase admin or use the Supabase dashboard
-- to delete the user manually
