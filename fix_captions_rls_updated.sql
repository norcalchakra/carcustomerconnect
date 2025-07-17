-- First, let's check what policies already exist
SELECT policyname
FROM pg_policies 
WHERE tablename = 'captions';

-- Drop specific policies if they exist (the ones with the original names)
DROP POLICY IF EXISTS "Users can view captions for their vehicles" ON public.captions;
DROP POLICY IF EXISTS "Users can insert captions for their vehicles" ON public.captions;
DROP POLICY IF EXISTS "Users can update captions for their vehicles" ON public.captions;
DROP POLICY IF EXISTS "Users can delete captions for their vehicles" ON public.captions;

-- Now let's check if the permissive policies already exist
-- If they don't exist, we'll create them
DO $$
BEGIN
    -- Check and create SELECT policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'captions' AND policyname = 'Users can view any captions') THEN
        CREATE POLICY "Users can view any captions" 
        ON public.captions FOR SELECT 
        USING (true);
    END IF;
    
    -- Check and create INSERT policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'captions' AND policyname = 'Users can insert any captions') THEN
        CREATE POLICY "Users can insert any captions" 
        ON public.captions FOR INSERT 
        WITH CHECK (true);
    END IF;
    
    -- Check and create UPDATE policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'captions' AND policyname = 'Users can update any captions') THEN
        CREATE POLICY "Users can update any captions" 
        ON public.captions FOR UPDATE 
        USING (true);
    END IF;
    
    -- Check and create DELETE policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'captions' AND policyname = 'Users can delete any captions') THEN
        CREATE POLICY "Users can delete any captions" 
        ON public.captions FOR DELETE 
        USING (true);
    END IF;
END
$$;
