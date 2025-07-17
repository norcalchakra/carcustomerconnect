-- Add captions table for social media content
CREATE TABLE IF NOT EXISTS public.captions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES public.vehicle_events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT[],
  posted_to_facebook BOOLEAN DEFAULT FALSE,
  posted_to_instagram BOOLEAN DEFAULT FALSE,
  posted_to_google BOOLEAN DEFAULT FALSE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  post_ids JSONB
);

-- Enable Row Level Security
ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;

-- Create policies for captions
CREATE POLICY "Users can view captions for their vehicles" 
  ON public.captions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = captions.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert captions for their vehicles" 
  ON public.captions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = captions.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can update captions for their vehicles" 
  ON public.captions FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = captions.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete captions for their vehicles" 
  ON public.captions FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = captions.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

-- Add sample data
INSERT INTO public.captions (vehicle_id, event_id, content, hashtags)
VALUES 
  (1, 1, 'Just added to our inventory! This sleek 2020 Toyota Camry is ready for a new home. Stop by for a test drive today!', ARRAY['Toyota', 'Camry', 'NewArrival', 'UsedCars']),
  (2, 4, 'Fresh from our service department! This 2019 Honda Civic has passed our 120-point inspection and is ready to hit the road. Low miles and great fuel economy!', ARRAY['Honda', 'Civic', 'CarMaintenance', 'ReadyForSale']);
