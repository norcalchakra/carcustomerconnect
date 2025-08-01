-- SQL to delete user with email chris.ai.vids@outlook.com from Supabase auth tables
-- Run this in the Supabase SQL Editor

-- First, get the user ID to verify we're targeting the right user
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'chris.ai.vids@outlook.com';

-- Store the user ID in a variable for easier reference
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'chris.ai.vids@outlook.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with email chris.ai.vids@outlook.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', target_user_id;
    
    -- Delete from auth.identities first (child table)
    DELETE FROM auth.identities WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted identities for user';
    
    -- Delete from auth.sessions (if any exist)
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted sessions for user';
    
    -- Delete from auth.refresh_tokens (if any exist)
    -- Note: refresh_tokens.user_id is stored as varchar, so we need to cast
    DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::text;
    RAISE NOTICE 'Deleted refresh tokens for user';
    
    -- Finally, delete from auth.users (parent table)
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE 'Deleted user from auth.users';
    
END $$;

-- Verify deletion
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'chris.ai.vids@outlook.com';

-- This should return no rows if the deletion was successful
