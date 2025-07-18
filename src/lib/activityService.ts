import { supabase } from './supabase';
import { SocialPost } from './socialPostsApi';

export interface ActivityEvent {
  id: number;
  vehicle_id: number;
  event_type: 'acquired' | 'service_complete' | 'ready_for_sale' | 'sold';
  notes?: string;
  created_at: string;
  vehicle?: {
    year: number;
    make: string;
    model: string;
    vin: string;
    stock_number: string;
  };
}

export interface RecentActivity {
  id: string | number; // Changed to string | number to support compound IDs
  vehicle: string;
  vehicleId: number;
  status: string;
  time: string;
  notes?: string;
  isSocialPost?: boolean;
  platforms?: string[];
}

/**
 * Format a timestamp into a relative time string (e.g., "2 hours ago", "Yesterday", etc.)
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }
  
  // Format as date
  return date.toLocaleDateString();
};

/**
 * Get status display text from event_type
 */
export const getStatusDisplayText = (eventType: string): string => {
  switch (eventType) {
    case 'acquired':
      return 'Just Traded In';
    case 'service_complete':
      return 'Service Completed';
    case 'ready_for_sale':
      return 'Ready for Sale';
    case 'sold':
      return 'Sold';
    default:
      return 'Updated';
  }
};

/**
 * Fetch recent activity for a dealership
 */
export const fetchRecentActivity = async (dealershipId: number, limit: number = 5): Promise<RecentActivity[]> => {
  try {
    // Query vehicle events with vehicle details
    const { data: events, error } = await supabase
      .from('vehicle_events')
      .select(`
        id,
        created_at,
        event_type,
        notes,
        vehicle_id,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('vehicles.dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
    
    // Transform the data for display
    return events.map((event: any) => ({
      id: event.id,
      vehicleId: event.vehicle_id,
      vehicle: `${event.vehicles?.year} ${event.vehicles?.make} ${event.vehicles?.model}`,
      status: getStatusDisplayText(event.event_type),
      time: formatRelativeTime(event.created_at),
      notes: event.notes
    }));
  } catch (error) {
    console.error('Error in fetchRecentActivity:', error);
    return [];
  }
};

/**
 * Fetch social media activity for a dealership
 */
export const fetchSocialMediaActivity = async (dealershipId: number, limit: number = 3): Promise<RecentActivity[]> => {
  try {
    // Query social posts table
    const { data: socialPosts, error } = await supabase
      .from('social_posts')
      .select(`
        id,
        created_at,
        vehicle_id,
        content,
        platform,
        image_urls,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching social media activity:', error);
      return [];
    }
    
    if (!socialPosts || socialPosts.length === 0) {
      return [];
    }
    
    // Cast the data to the correct type to fix TypeScript errors
    return socialPosts.map((post: any) => {
      // Cast to the correct type
      const socialPost = post as unknown as SocialPost & { vehicles?: any };
      
      const vehicleYear = socialPost.vehicles?.year || 'Unknown';
      const vehicleMake = socialPost.vehicles?.make || 'Unknown';
      const vehicleModel = socialPost.vehicles?.model || 'Unknown';
      
      return {
        id: socialPost.id!,
        vehicleId: socialPost.vehicle_id || 0,
        vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
        status: 'Social Media Post',
        time: formatRelativeTime(socialPost.created_at || ''),
        notes: socialPost.content,
        isSocialPost: true,
        platforms: socialPost.platform ? [socialPost.platform] : []
      };
    });
  } catch (error) {
    console.error('Error in fetchSocialMediaActivity:', error);
    return [];
  }
};

/**
 * Fetch all activity (vehicle events and social posts) for a dealership
 */
export const fetchAllActivity = async (dealershipId: number, limit: number = 10): Promise<RecentActivity[]> => {
  try {
    console.log(`Fetching activity for dealership ID: ${dealershipId} with limit: ${limit}`);
    
    if (!dealershipId) {
      console.error('Invalid dealership ID provided');
      return [];
    }
    
    // Fetch vehicle events (non-social posts)
    const { data: events, error: eventsError } = await supabase
      .from('vehicle_events')
      .select(`
        id,
        created_at,
        event_type,
        notes,
        vehicle_id,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('vehicles.dealership_id', dealershipId)
      .not('event_type', 'eq', 'social_post') // Exclude old social post events
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (eventsError) {
      console.error('Error fetching vehicle events:', eventsError);
      return [];
    }
    
    // Fetch social posts
    const { data: socialPosts, error: postsError } = await supabase
      .from('social_posts')
      .select(`
        id,
        created_at,
        vehicle_id,
        content,
        platform,
        image_urls,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (postsError) {
      console.error('Error fetching social posts:', postsError);
      return [];
    }
    
    // Convert vehicle events to RecentActivity format
    const vehicleActivities = events ? events.map((event: any) => {
      const vehicleYear = event.vehicles?.year || 'Unknown';
      const vehicleMake = event.vehicles?.make || 'Unknown';
      const vehicleModel = event.vehicles?.model || 'Unknown';
      
      return {
        id: event.id,
        vehicleId: event.vehicle_id,
        vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
        status: getStatusDisplayText(event.event_type),
        time: formatRelativeTime(event.created_at),
        notes: event.notes,
        isSocialPost: false
      };
    }) : [];
    
    // Convert social posts to RecentActivity format
    const socialActivities = socialPosts ? socialPosts.map((post: any) => {
      // Cast to the correct type
      const socialPost = post as unknown as SocialPost & { vehicles?: any };
      
      const vehicleYear = socialPost.vehicles?.year || 'Unknown';
      const vehicleMake = socialPost.vehicles?.make || 'Unknown';
      const vehicleModel = socialPost.vehicles?.model || 'Unknown';
      
      return {
        id: socialPost.id!,
        vehicleId: socialPost.vehicle_id || 0,
        vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
        status: 'Social Media Post',
        time: formatRelativeTime(socialPost.created_at || ''),
        notes: socialPost.content,
        isSocialPost: true,
        platforms: socialPost.platform ? [socialPost.platform] : []
      };
    }) : [];
    
    // Combine and sort all activities by date (newest first)
    const allActivities = [...vehicleActivities, ...socialActivities];
    
    // Ensure unique IDs by prefixing with source type
    allActivities.forEach(activity => {
      // Create a compound ID that includes the source type (vehicle event or social post)
      activity.id = activity.isSocialPost ? `social_${activity.id}` : `vehicle_${activity.id}`;
    });
    
    allActivities.sort((a, b) => {
      // Try to parse the relative time strings or fall back to string comparison
      const dateA = new Date(b.time).getTime();
      const dateB = new Date(a.time).getTime();
      
      // If both are valid dates, compare them
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      
      // Otherwise fall back to string comparison
      return b.time.localeCompare(a.time);
    });
    
    // Limit to requested number
    const limitedActivities = allActivities.slice(0, limit);
    
    console.log(`Found ${limitedActivities.length} total activity items`);
    return limitedActivities;
  } catch (error) {
    console.error('Error in fetchAllActivity:', error);
    return [];
  }
};
