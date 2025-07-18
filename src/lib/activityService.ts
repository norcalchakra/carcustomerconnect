import { supabase } from './supabase';

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
  id: number;
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
    // Query vehicle events with social media posts
    const { data: events, error } = await supabase
      .from('vehicle_events')
      .select(`
        id,
        created_at,
        event_type,
        notes,
        vehicle_id,
        posted_to_facebook,
        posted_to_instagram,
        posted_to_google,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('vehicles.dealership_id', dealershipId)
      .or('posted_to_facebook.eq.true,posted_to_instagram.eq.true,posted_to_google.eq.true')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching social media activity:', error);
      return [];
    }
    
    // Transform the data for display
    return events.map((event: any) => {
      let platforms = [];
      if (event.posted_to_facebook) platforms.push('facebook');
      if (event.posted_to_instagram) platforms.push('instagram');
      if (event.posted_to_google) platforms.push('google');
      
      return {
        id: event.id,
        vehicleId: event.vehicle_id,
        vehicle: `${event.vehicles?.year} ${event.vehicles?.make} ${event.vehicles?.model}`,
        status: 'Social Media Post',
        time: formatRelativeTime(event.created_at),
        notes: event.notes,
        isSocialPost: true,
        platforms: platforms
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
    // Query all vehicle events
    const { data: events, error } = await supabase
      .from('vehicle_events')
      .select(`
        id,
        created_at,
        event_type,
        notes,
        vehicle_id,
        posted_to_facebook,
        posted_to_instagram,
        posted_to_google,
        vehicles(year, make, model, vin, stock_number)
      `)
      .eq('vehicles.dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching all activity:', error);
      return [];
    }
    
    // Transform the data for display
    return events.map((event: any) => {
      const platforms = [];
      if (event.posted_to_facebook) platforms.push('facebook');
      if (event.posted_to_instagram) platforms.push('instagram');
      if (event.posted_to_google) platforms.push('google');
      
      const isSocialPost = platforms.length > 0;
      
      return {
        id: event.id,
        vehicleId: event.vehicle_id,
        vehicle: `${event.vehicles?.year} ${event.vehicles?.make} ${event.vehicles?.model}`,
        status: isSocialPost ? 'Social Media Post' : getStatusDisplayText(event.event_type),
        time: formatRelativeTime(event.created_at),
        notes: event.notes,
        isSocialPost,
        platforms: platforms.length > 0 ? platforms : undefined
      };
    });
  } catch (error) {
    console.error('Error in fetchAllActivity:', error);
    return [];
  }
};
