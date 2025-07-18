import { supabase } from './supabase';

export interface ScheduledPost {
  id?: string;
  user_id?: string;
  dealership_id: number;
  vehicle_id?: number;
  content: string;
  image_urls?: string[];
  platforms: string[];
  scheduled_time: Date;
  status?: 'pending' | 'posted' | 'failed' | 'cancelled';
  metadata?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface ScheduledPostWithDetails extends ScheduledPost {
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  stock_number?: string;
  dealership_name?: string;
}

/**
 * Create a new scheduled post
 */
export const createScheduledPost = async (post: ScheduledPost): Promise<ScheduledPost | null> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(post)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating scheduled post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return null;
  }
};

/**
 * Get all scheduled posts for the current user's dealership
 */
export const getScheduledPosts = async (): Promise<ScheduledPostWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('upcoming_scheduled_posts')
      .select('*')
      .order('scheduled_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return [];
  }
};

/**
 * Get a scheduled post by ID
 */
export const getScheduledPostById = async (id: string): Promise<ScheduledPost | null> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching scheduled post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching scheduled post:', error);
    return null;
  }
};

/**
 * Update a scheduled post
 */
export const updateScheduledPost = async (id: string, updates: Partial<ScheduledPost>): Promise<ScheduledPost | null> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating scheduled post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return null;
  }
};

/**
 * Cancel a scheduled post
 */
export const cancelScheduledPost = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) {
      console.error('Error cancelling scheduled post:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    return false;
  }
};

/**
 * Delete a scheduled post
 */
export const deleteScheduledPost = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting scheduled post:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return false;
  }
};

/**
 * Get pending posts that are due for publishing
 */
export const getPendingPostsDue = async (): Promise<ScheduledPost[]> => {
  try {
    const now = new Date();
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString());
    
    if (error) {
      console.error('Error fetching pending posts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    return [];
  }
};

/**
 * Mark a post as posted
 */
export const markPostAsPosted = async (id: string, postIds: Record<string, string>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'posted',
        metadata: { postIds }
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error marking post as posted:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking post as posted:', error);
    return false;
  }
};

/**
 * Mark a post as failed
 */
export const markPostAsFailed = async (id: string, error: any): Promise<boolean> => {
  try {
    const { error: dbError } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'failed',
        metadata: { error: String(error) }
      })
      .eq('id', id);
    
    if (dbError) {
      console.error('Error marking post as failed:', dbError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error marking post as failed:', err);
    return false;
  }
};

/**
 * Get recommended posting times based on engagement data
 * In a real implementation, this would analyze historical data
 */
export const getRecommendedPostingTimes = async (platform: string): Promise<{time: string, engagement: string}[]> => {
  // Mock implementation - would be replaced with actual analytics in production
  const commonTimes = [
    { time: '08:00', engagement: 'High morning engagement' },
    { time: '12:30', engagement: 'Lunch break browsing peak' },
    { time: '17:30', engagement: 'After work commute time' },
    { time: '20:00', engagement: 'Evening relaxation period' }
  ];
  
  const facebookTimes = [
    { time: '13:00', engagement: 'Peak Facebook engagement' },
    { time: '15:00', engagement: 'High click-through rate' },
    ...commonTimes
  ];
  
  const instagramTimes = [
    { time: '11:00', engagement: 'Peak Instagram browsing' },
    { time: '19:00', engagement: 'Evening Instagram usage spike' },
    ...commonTimes
  ];
  
  const googleTimes = [
    { time: '09:00', engagement: 'Morning search activity' },
    { time: '14:00', engagement: 'Afternoon research peak' },
    ...commonTimes
  ];
  
  // Return platform-specific recommendations or default to common times
  switch (platform.toLowerCase()) {
    case 'facebook':
      return facebookTimes;
    case 'instagram':
      return instagramTimes;
    case 'google':
      return googleTimes;
    default:
      return commonTimes;
  }
};
