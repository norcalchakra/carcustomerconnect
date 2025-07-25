-- Add is_deleted column with default false
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Create an index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_vehicles_is_deleted ON vehicles(is_deleted);

-- Update existing RLS policies to include is_deleted check if they exist
DO $$
BEGIN
    -- Check if the select policy exists and update it
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicles' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.vehicles;
        CREATE POLICY "Enable read access for authenticated users"
        ON public.vehicles
        FOR SELECT
        TO authenticated
        USING (is_deleted = FALSE);
    END IF;

    -- Check if the update policy exists and update it
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicles' 
        AND policyname = 'Enable update for users based on user_id'
    ) THEN
        DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.vehicles;
        CREATE POLICY "Enable update for users based on user_id"
        ON public.vehicles
        FOR UPDATE
        TO authenticated
        USING (is_deleted = FALSE);
    END IF;
END $$;
