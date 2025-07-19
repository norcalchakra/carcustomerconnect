-- Safe SQL script to update the competitive_differentiators table
-- This script checks if columns exist before attempting to add or modify them
-- It also preserves existing data when renaming columns

-- Wrap everything in a transaction to ensure all changes are applied together or not at all
BEGIN;

-- Check if the table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'competitive_differentiators'
    ) THEN
        RAISE EXCEPTION 'Table competitive_differentiators does not exist';
    END IF;
END $$;

-- Step 1: Check if we need to rename the 'differentiator' column to 'title'
DO $$ 
BEGIN
    -- Check if 'differentiator' column exists and 'title' doesn't
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'competitive_differentiators' 
        AND column_name = 'differentiator'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'competitive_differentiators' 
        AND column_name = 'title'
    ) THEN
        -- Rename the column
        EXECUTE 'ALTER TABLE competitive_differentiators RENAME COLUMN differentiator TO title';
        RAISE NOTICE 'Renamed column "differentiator" to "title"';
    ELSIF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'competitive_differentiators' 
        AND column_name = 'title'
    ) THEN
        -- If neither column exists, add the title column
        EXECUTE 'ALTER TABLE competitive_differentiators ADD COLUMN title TEXT NOT NULL DEFAULT ''Untitled''';
        RAISE NOTICE 'Added new column "title"';
    END IF;
END $$;

-- Step 2: Check if we need to add the 'priority' column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'competitive_differentiators' 
        AND column_name = 'priority'
    ) THEN
        -- Add the priority column with a default value
        EXECUTE 'ALTER TABLE competitive_differentiators ADD COLUMN priority INTEGER DEFAULT 1';
        
        -- Set priority based on creation date (older entries get lower priority)
        EXECUTE '
            WITH ranked AS (
                SELECT 
                    id, 
                    ROW_NUMBER() OVER (PARTITION BY dealership_id, category ORDER BY created_at) AS row_num
                FROM 
                    competitive_differentiators
            )
            UPDATE competitive_differentiators
            SET priority = ranked.row_num
            FROM ranked
            WHERE competitive_differentiators.id = ranked.id
        ';
        
        RAISE NOTICE 'Added column "priority" and set values based on creation date';
    END IF;
END $$;

-- Step 3: Check if we need to update the 'category' column constraints
-- First, check what values are currently in use
CREATE TEMPORARY TABLE IF NOT EXISTS temp_categories AS
SELECT DISTINCT category FROM competitive_differentiators;

-- Add any missing categories to ensure data integrity
DO $$ 
BEGIN
    -- Check if we need to update any existing categories to match our new schema
    UPDATE competitive_differentiators 
    SET category = 'service' 
    WHERE category NOT IN ('service', 'customer_experience', 'financial', 'inventory', 'warranty', 'community', 'other');
    
    IF FOUND THEN
        RAISE NOTICE 'Updated invalid category values to "service"';
    END IF;
END $$;

-- Step 4: Check if the description column is nullable and make it NOT NULL with default if needed
DO $$ 
BEGIN
    -- Check if description column is nullable
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'competitive_differentiators' 
        AND column_name = 'description'
        AND is_nullable = 'YES'
    ) THEN
        -- Update any NULL descriptions to an empty string
        EXECUTE 'UPDATE competitive_differentiators SET description = '''' WHERE description IS NULL';
        
        -- Make the column NOT NULL
        EXECUTE 'ALTER TABLE competitive_differentiators ALTER COLUMN description SET NOT NULL';
        
        RAISE NOTICE 'Updated description column to NOT NULL';
    END IF;
END $$;

-- Step 5: Check if we need to drop the 'is_active' column as it's not used in the interface
-- We'll keep this column for now as it might be used elsewhere, but we can comment this out if needed
/*
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'competitive_differentiators' 
        AND column_name = 'is_active'
    ) THEN
        EXECUTE 'ALTER TABLE competitive_differentiators DROP COLUMN is_active';
        RAISE NOTICE 'Dropped column "is_active"';
    END IF;
END $$;
*/

-- Commit all changes if everything succeeded
COMMIT;

-- Output final table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'competitive_differentiators'
ORDER BY 
    ordinal_position;
