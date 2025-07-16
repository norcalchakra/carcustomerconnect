-- Create tables for Car Customer Connect

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create dealerships table
CREATE TABLE IF NOT EXISTS dealerships (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT NOT NULL,
  stock_number TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  mileage INTEGER NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('acquired', 'in_service', 'ready_for_sale', 'sold')),
  description TEXT,
  features TEXT[],
  dealership_id BIGINT NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE
);

-- Create vehicle_events table
CREATE TABLE IF NOT EXISTS vehicle_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('acquired', 'service_complete', 'ready_for_sale', 'sold')),
  notes TEXT,
  posted_to_facebook BOOLEAN DEFAULT FALSE,
  posted_to_instagram BOOLEAN DEFAULT FALSE,
  posted_to_google BOOLEAN DEFAULT FALSE,
  post_id TEXT
);

-- Create vehicle_photos table
CREATE TABLE IF NOT EXISTS vehicle_photos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  order INTEGER NOT NULL DEFAULT 0
);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Set up Row Level Security policies

-- Dealerships: Users can only access their own dealerships
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY dealerships_select_policy ON dealerships 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY dealerships_insert_policy ON dealerships 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY dealerships_update_policy ON dealerships 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY dealerships_delete_policy ON dealerships 
  FOR DELETE USING (auth.uid() = user_id);

-- Vehicles: Users can only access vehicles from their dealerships
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicles_select_policy ON vehicles 
  FOR SELECT USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vehicles_insert_policy ON vehicles 
  FOR INSERT WITH CHECK (
    dealership_id IN (
      SELECT id FROM dealerships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vehicles_update_policy ON vehicles 
  FOR UPDATE USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vehicles_delete_policy ON vehicles 
  FOR DELETE USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE user_id = auth.uid()
    )
  );

-- Vehicle Events: Users can only access events for their vehicles
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_events_select_policy ON vehicle_events 
  FOR SELECT USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY vehicle_events_insert_policy ON vehicle_events 
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY vehicle_events_update_policy ON vehicle_events 
  FOR UPDATE USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY vehicle_events_delete_policy ON vehicle_events 
  FOR DELETE USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

-- Vehicle Photos: Users can only access photos for their vehicles
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_photos_select_policy ON vehicle_photos 
  FOR SELECT USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY vehicle_photos_insert_policy ON vehicle_photos 
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY vehicle_photos_update_policy ON vehicle_photos 
  FOR UPDATE USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY vehicle_photos_delete_policy ON vehicle_photos 
  FOR DELETE USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE user_id = auth.uid()
      )
    )
  );

-- Storage: Allow authenticated users to upload to their folder
CREATE POLICY storage_insert_policy ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND 
    auth.uid() = (
      SELECT user_id FROM dealerships WHERE id = (
        SELECT dealership_id FROM vehicles WHERE id::text = (regexp_split_to_array(name, '/'))[1]::bigint
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp on vehicles table
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
