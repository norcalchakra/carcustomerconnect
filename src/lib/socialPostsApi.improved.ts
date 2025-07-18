import { supabase } from './supabase';

export interface SocialPost {
  id?: number;
  created_at?: string;
  vehicle_id?: number;
  dealership_id: number;
  content: string;
  content_summary?: string;
  platform: string;
  post_id?: string;
  post_url?: string;
  image_urls?: string[];
  status?: 'posted' | 'scheduled' | 'failed';
  scheduled_for?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  metadata?: Record<string, any>;
}

export type SocialPostInsert = Omit<SocialPost, 'id' | 'created_at'>;

/**
 * Create a new social media post record
 */
export const create = async (post: SocialPostInsert): Promise<SocialPost | null> => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .insert(post)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating social post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception in socialPostsApi.create:', error);
    return null;
  }
};

/**
 * Get a social post by ID
 */
export const getById = async (id: number): Promise<SocialPost | null> => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching social post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception in socialPostsApi.getById:', error);
    return null;
  }
};

/**
 * Get social posts by dealership ID
 */
export const getByDealership = async (dealershipId: number, limit: number = 10): Promise<SocialPost[]> => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching social posts by dealership:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in socialPostsApi.getByDealership:', error);
    return [];
  }
};

/**
 * Get social posts by vehicle ID
 */
export const getByVehicle = async (vehicleId: number, limit: number = 10): Promise<SocialPost[]> => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching social posts by vehicle:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in socialPostsApi.getByVehicle:', error);
    return [];
  }
};

/**
 * Update a social post
 */
export const update = async (id: number, updates: Partial<SocialPost>): Promise<SocialPost | null> => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating social post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception in socialPostsApi.update:', error);
    return null;
  }
};

/**
 * Delete a social post
 */
export const remove = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting social post:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in socialPostsApi.remove:', error);
    return false;
  }
};

/**
 * Get engagement metrics for a post
 */
export const getEngagement = async (platform: string, postId: string): Promise<any> => {
  // This would normally call the actual social media API
  // For now, return mock data
  return {
    likes: Math.floor(Math.random() * 50),
    comments: Math.floor(Math.random() * 10),
    shares: Math.floor(Math.random() * 5)
  };
};

const socialPostsApi = {
  create,
  getById,
  getByDealership,
  getByVehicle,
  update,
  remove,
  getEngagement
};

export { socialPostsApi };
