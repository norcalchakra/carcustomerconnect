-- Create captions table for AI-generated social media captions
CREATE TABLE IF NOT EXISTS public.captions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.vehicle_events(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    image_urls TEXT[] DEFAULT '{}',
    posted_to_facebook BOOLEAN DEFAULT false,
    facebook_post_id TEXT,
    facebook_posted_at TIMESTAMP WITH TIME ZONE,
    posted_to_instagram BOOLEAN DEFAULT false,
    instagram_post_id TEXT,
    instagram_posted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_captions_vehicle_id ON public.captions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_captions_event_id ON public.captions(event_id);
CREATE INDEX IF NOT EXISTS idx_captions_created_at ON public.captions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access captions for vehicles in their dealership
CREATE POLICY "Users can view captions for their dealership's vehicles" ON public.captions
    FOR SELECT USING (
        vehicle_id IN (
            SELECT v.id FROM public.vehicles v
            JOIN public.dealerships d ON v.dealership_id = d.id
            WHERE d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert captions for their dealership's vehicles" ON public.captions
    FOR INSERT WITH CHECK (
        vehicle_id IN (
            SELECT v.id FROM public.vehicles v
            JOIN public.dealerships d ON v.dealership_id = d.id
            WHERE d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update captions for their dealership's vehicles" ON public.captions
    FOR UPDATE USING (
        vehicle_id IN (
            SELECT v.id FROM public.vehicles v
            JOIN public.dealerships d ON v.dealership_id = d.id
            WHERE d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete captions for their dealership's vehicles" ON public.captions
    FOR DELETE USING (
        vehicle_id IN (
            SELECT v.id FROM public.vehicles v
            JOIN public.dealerships d ON v.dealership_id = d.id
            WHERE d.user_id = auth.uid()
        )
    );

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_captions_updated_at
    BEFORE UPDATE ON public.captions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
