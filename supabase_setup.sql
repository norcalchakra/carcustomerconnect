-- Supabase SQL setup for Car Customer Connect
-- This script creates all the necessary tables and initial data

-- Create dealerships table
CREATE TABLE IF NOT EXISTS public.dealerships (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT NOT NULL,
  stock_number TEXT NOT NULL,
  price NUMERIC NOT NULL,
  mileage INTEGER NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('acquired', 'in_service', 'ready_for_sale', 'sold')),
  description TEXT,
  features TEXT[],
  dealership_id BIGINT NOT NULL REFERENCES public.dealerships(id)
);

-- Create vehicle_events table
CREATE TABLE IF NOT EXISTS public.vehicle_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('acquired', 'service_complete', 'ready_for_sale', 'sold')),
  notes TEXT,
  posted_to_facebook BOOLEAN DEFAULT FALSE,
  posted_to_instagram BOOLEAN DEFAULT FALSE,
  posted_to_google BOOLEAN DEFAULT FALSE,
  post_id TEXT
);

-- Create vehicle_photos table
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for dealerships
CREATE POLICY "Users can view their own dealerships" 
  ON public.dealerships FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dealerships" 
  ON public.dealerships FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dealerships" 
  ON public.dealerships FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for vehicles
CREATE POLICY "Users can view vehicles in their dealerships" 
  ON public.vehicles FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.dealerships 
    WHERE dealerships.id = vehicles.dealership_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert vehicles in their dealerships" 
  ON public.vehicles FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dealerships 
    WHERE dealerships.id = vehicles.dealership_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can update vehicles in their dealerships" 
  ON public.vehicles FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.dealerships 
    WHERE dealerships.id = vehicles.dealership_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete vehicles in their dealerships" 
  ON public.vehicles FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.dealerships 
    WHERE dealerships.id = vehicles.dealership_id 
    AND dealerships.user_id = auth.uid()
  ));

-- Create policies for vehicle_events
CREATE POLICY "Users can view events for their vehicles" 
  ON public.vehicle_events FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = vehicle_events.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert events for their vehicles" 
  ON public.vehicle_events FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = vehicle_events.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

-- Create policies for vehicle_photos
CREATE POLICY "Users can view photos for their vehicles" 
  ON public.vehicle_photos FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = vehicle_photos.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert photos for their vehicles" 
  ON public.vehicle_photos FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = vehicle_photos.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete photos for their vehicles" 
  ON public.vehicle_photos FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.vehicles 
    JOIN public.dealerships ON vehicles.dealership_id = dealerships.id 
    WHERE vehicles.id = vehicle_photos.vehicle_id 
    AND dealerships.user_id = auth.uid()
  ));

-- Insert sample data for testing

-- For testing purposes, temporarily alter the dealerships table to make user_id nullable
ALTER TABLE public.dealerships ALTER COLUMN user_id DROP NOT NULL;

-- Insert a sample dealership with ID 1
INSERT INTO public.dealerships (name, address, city, state, zip, phone, website)
VALUES (
  'ABC Motors',
  '123 Main St',
  'Anytown',
  'CA',
  '12345',
  '(555) 123-4567',
  'https://abcmotors.example.com'
);

-- Insert sample vehicles
INSERT INTO public.vehicles (year, make, model, vin, stock_number, price, mileage, color, status, description, dealership_id)
VALUES
  (2022, 'Toyota', 'Camry', '4T1BF1FK5CU123456', 'ST12345', 25000, 15000, 'Silver', 'ready_for_sale', 'Well-maintained sedan with excellent fuel economy', 1),
  (2021, 'Honda', 'Civic', '2HGFC2F53MH123456', 'ST12346', 22000, 18000, 'Blue', 'ready_for_sale', 'Sporty compact car with advanced safety features', 1),
  (2023, 'Ford', 'F-150', '1FTFW1ET5DFA12345', 'ST12347', 45000, 5000, 'Black', 'acquired', 'Powerful truck with towing capability', 1);

-- Insert sample vehicle events
INSERT INTO public.vehicle_events (vehicle_id, event_type, notes)
VALUES
  (1, 'acquired', 'Purchased from auction'),
  (1, 'service_complete', 'Completed 30-point inspection'),
  (1, 'ready_for_sale', 'Vehicle detailed and ready for showroom'),
  (2, 'acquired', 'Trade-in from repeat customer'),
  (2, 'service_complete', 'Oil change and new tires'),
  (2, 'ready_for_sale', 'Priced competitively for quick sale'),
  (3, 'acquired', 'Dealer transfer from sister location');

-- Insert sample vehicle photos
INSERT INTO public.vehicle_photos (vehicle_id, url, "order")
VALUES
  (1, 'https://example.com/photos/camry1.jpg', 1),
  (1, 'https://example.com/photos/camry2.jpg', 2),
  (2, 'https://example.com/photos/civic1.jpg', 1),
  (3, 'https://example.com/photos/f150_1.jpg', 1);
