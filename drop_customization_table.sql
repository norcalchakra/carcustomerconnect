-- SQL script to remove the customization_parameters table and related policies
-- For Car Customer Connect application

-- First, drop the policy if it exists
DO $$ 
BEGIN
    -- Check if customization_parameters_policy exists before attempting to drop it
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'customization_parameters' 
        AND policyname = 'customization_parameters_policy'
    ) THEN
        DROP POLICY customization_parameters_policy ON customization_parameters;
    END IF;
END
$$;

-- Then drop the table itself
DROP TABLE IF EXISTS customization_parameters;

-- Output confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Customization parameters table and related policies have been removed.';
END
$$;
