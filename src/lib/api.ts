import { supabase } from './supabase';
import type { Database } from '../types/database.types';

// Type definitions
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export type VehicleEvent = Database['public']['Tables']['vehicle_events']['Row'];
export type VehicleEventInsert = Database['public']['Tables']['vehicle_events']['Insert'];

export type VehiclePhoto = Database['public']['Tables']['vehicle_photos']['Row'];
export type VehiclePhotoInsert = Database['public']['Tables']['vehicle_photos']['Insert'];

export type Dealership = Database['public']['Tables']['dealerships']['Row'];

// Vehicle API
export const vehiclesApi = {
  // Get all vehicles for a dealership
  getAll: async (dealershipId: number) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Vehicle[];
  },

  // Get a single vehicle by ID
  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  },

  // Create a new vehicle
  create: async (vehicle: VehicleInsert) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  },

  // Update a vehicle
  update: async (id: number, vehicle: VehicleUpdate) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  },

  // Delete a vehicle
  delete: async (id: number) => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Get vehicles by status
  getByStatus: async (dealershipId: number, status: Vehicle['status']) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('dealership_id', dealershipId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Vehicle[];
  },

  // Count vehicles by status
  countByStatus: async (dealershipId: number) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('status')
      .eq('dealership_id', dealershipId);
    
    if (error) throw error;
    
    const counts = {
      acquired: 0,
      in_service: 0,
      ready_for_sale: 0,
      sold: 0
    };
    
    data.forEach(vehicle => {
      counts[vehicle.status as keyof typeof counts]++;
    });
    
    return counts;
  }
};

// Vehicle Events API
export const eventsApi = {
  // Get all events for a vehicle
  getForVehicle: async (vehicleId: number) => {
    const { data, error } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as VehicleEvent[];
  },

  // Create a new event
  create: async (event: VehicleEventInsert) => {
    const { data, error } = await supabase
      .from('vehicle_events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data as VehicleEvent;
  }
};

// Vehicle Photos API
export const photosApi = {
  // Get all photos for a vehicle
  getForVehicle: async (vehicleId: number) => {
    const { data, error } = await supabase
      .from('vehicle_photos')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('order', { ascending: true });
    
    if (error) throw error;
    return data as VehiclePhoto[];
  },

  // Upload a photo
  upload: async (vehicleId: number, file: File) => {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${vehicleId}/${Date.now()}.${fileExt}`;
    const filePath = `vehicle-photos/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('photos')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('photos')
      .getPublicUrl(filePath);

    // Get the current highest order
    const { data: photos, error: orderError } = await supabase
      .from('vehicle_photos')
      .select('order')
      .eq('vehicle_id', vehicleId)
      .order('order', { ascending: false })
      .limit(1);
    
    if (orderError) throw orderError;
    
    const nextOrder = photos.length > 0 ? photos[0].order + 1 : 0;

    // Save to database
    const photoInsert: VehiclePhotoInsert = {
      vehicle_id: vehicleId,
      url: publicUrl,
      order: nextOrder
    };

    const { data, error } = await supabase
      .from('vehicle_photos')
      .insert(photoInsert)
      .select()
      .single();
    
    if (error) throw error;
    return data as VehiclePhoto;
  },

  // Delete a photo
  delete: async (id: number) => {
    // First get the photo to get the URL
    const { data: photo, error: getError } = await supabase
      .from('vehicle_photos')
      .select('url')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;

    // Extract the path from the URL
    const url = new URL(photo.url);
    const pathParts = url.pathname.split('/');
    const storagePath = pathParts.slice(pathParts.indexOf('photos') + 1).join('/');

    // Delete from storage
    const { error: storageError } = await supabase
      .storage
      .from('photos')
      .remove([storagePath]);
    
    if (storageError) throw storageError;

    // Delete from database
    const { error } = await supabase
      .from('vehicle_photos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Authentication API
export const authApi = {
  // Sign up a new user
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in a user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  // Get the current user
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }
};

// Dealership API
export const dealershipApi = {
  // Get a dealership by user ID
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('dealerships')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data as Dealership | null;
  },

  // Create a new dealership
  create: async (dealership: Omit<Database['public']['Tables']['dealerships']['Insert'], 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('dealerships')
      .insert(dealership)
      .select()
      .single();
    
    if (error) throw error;
    return data as Dealership;
  },

  // Update a dealership
  update: async (id: number, dealership: Partial<Omit<Database['public']['Tables']['dealerships']['Update'], 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('dealerships')
      .update(dealership)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Dealership;
  }
};

// Social Media Caption API
export type Caption = {
  id?: number;
  vehicle_id: number;
  event_id: number;
  content: string;
  hashtags: string[];
  created_at?: string;
};

export type CaptionInsert = Omit<Caption, 'id' | 'created_at'>;

export const captionApi = {
  // Get all captions for a vehicle
  getForVehicle: async (vehicleId: number) => {
    const { data, error } = await supabase
      .from('captions')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Caption[];
  },

  // Get caption by event ID
  getByEventId: async (eventId: number) => {
    const { data, error } = await supabase
      .from('captions')
      .select('*')
      .eq('event_id', eventId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Caption | null;
  },

  // Create a new caption
  create: async (caption: CaptionInsert) => {
    const { data, error } = await supabase
      .from('captions')
      .insert(caption)
      .select()
      .single();
    
    if (error) throw error;
    return data as Caption;
  },

  // Update a caption
  update: async (id: number, caption: Partial<Omit<Caption, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('captions')
      .update(caption)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Caption;
  },

  // Delete a caption
  delete: async (id: number) => {
    const { error } = await supabase
      .from('captions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
