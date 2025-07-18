import { supabase } from './supabase';

// Type definitions for social posts
export interface SocialPost {
  id?: number;
  created_at?: string;
  vehicle_id?: number;
  dealership_id: number;
  content: string;
  platform: string; // 'facebook', 'instagram', 'google'
  post_id?: string;
  image_urls?: string[];
  status?: string; // 'posted', 'scheduled', 'failed'
  scheduled_for?: string;
  metadata?: Record<string, any>;
}

export type SocialPostInsert = Omit<SocialPost, 'id' | 'created_at'>;
export type SocialPostUpdate = Partial<Omit<SocialPost, 'id' | 'created_at'>>;

// Social Posts API
export const socialPostsApi = {
  // Get all posts for a dealership
  getAllForDealership: async (dealershipId: number, limit: number = 20) => {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*, vehicles(year, make, model, vin, stock_number)')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching social posts:', error);
      throw error;
    }
    
    return data as (SocialPost & { vehicles: any })[];
  },

  // Get all posts for a vehicle
  getAllForVehicle: async (vehicleId: number) => {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching vehicle social posts:', error);
      throw error;
    }
    
    return data as SocialPost[];
  },

  // Create a new social post
  create: async (post: SocialPostInsert) => {
    const { data, error } = await supabase
      .from('social_posts')
      .insert(post)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating social post:', error);
      throw error;
    }
    
    return data as SocialPost;
  },

  // Update a social post
  update: async (id: number, post: SocialPostUpdate) => {
    const { data, error } = await supabase
      .from('social_posts')
      .update(post)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating social post:', error);
      throw error;
    }
    
    return data as SocialPost;
  },

  // Delete a social post
  delete: async (id: number) => {
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting social post:', error);
      throw error;
    }
    
    return true;
  }
};
