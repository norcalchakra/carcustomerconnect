import React, { useState, useEffect } from 'react';
import { Caption, Vehicle, VehicleEvent } from '../../lib/api';
// Import mock Facebook API instead of real one
import { 
  mockInitFacebookSDK as initFacebookSDK, 
  mockIsFacebookConnected as isFacebookConnected,
  mockLoginWithFacebook as loginWithFacebook,
  mockGetUserPages as getUserPages,
  mockPostToFacebookPage as postToFacebookPage,
  updateCaptionWithFacebookPost
} from '../../lib/mockFacebookApi';
import { supabase } from '../../lib/supabase';
import './SocialPostForm.css';
import { createScheduledPost } from '../../lib/scheduledPostsService';
import PostScheduler from './PostScheduler';

interface SocialPostFormProps {
  caption: Caption;
  vehicle?: Vehicle; // Made optional since we're not using it currently
  event?: VehicleEvent; // Made optional since we're not using it currently
  onPost?: (platforms: string[]) => void;
}

export const SocialPostForm: React.FC<SocialPostFormProps> = ({ 
  caption, 
  vehicle,
  onPost 
}) => {
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [facebookConnected, setFacebookConnected] = useState<boolean>(false);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  // Using mock image URLs for development
  const [imageUrls] = useState<string[]>(['https://example.com/mock-image.jpg']);

  // Initialize Mock Facebook SDK on component mount
  useEffect(() => {
    const initFacebook = async () => {
      try {
        await initFacebookSDK();
        const connected = isFacebookConnected();
        setFacebookConnected(connected);
        
        if (connected) {
          // Try to get saved pages using the stored token
          const accessToken = localStorage.getItem('mock_fb_access_token'); // Use mock storage key
          if (accessToken) {
            try {
              const pages = await getUserPages(accessToken);
              setFacebookPages(pages);
              if (pages.length > 0) {
                setSelectedFacebookPage(pages[0].id);
              }
            } catch (err) {
              console.error('Error fetching Facebook pages:', err);
              // Token might be expired, clear it
              localStorage.removeItem('mock_fb_access_token'); // Use mock storage key
              setFacebookConnected(false);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing Facebook SDK:', err);
      }
    };
    
    initFacebook();
  }, []);

  const handleConnectFacebook = async () => {
    try {
      setError(null);
      console.log('Connecting to Facebook using mock implementation...');
      const accessToken = await loginWithFacebook();
      console.log('Got mock access token:', accessToken);
      const pages = await getUserPages(accessToken);
      console.log('Got mock pages:', pages);
      
      setFacebookPages(pages);
      setFacebookConnected(true);
      
      if (pages.length > 0) {
        setSelectedFacebookPage(pages[0].id);
        // Add Facebook to platforms if not already there
        if (!platforms.includes('facebook')) {
          setPlatforms([...platforms, 'facebook']);
        }
      }
    } catch (err) {
      console.error('Facebook login error:', err);
      setError('Failed to connect to Facebook. Please try again.');
    }
  };

  const handleTogglePlatform = (platform: string) => {
    if (platform === 'facebook' && !facebookConnected) {
      // If Facebook is not connected, initiate the connection process
      handleConnectFacebook();
      return;
    }
    
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  // Scheduling functionality will be implemented in the future
  
  const handleSchedulePost = async (scheduledTime: Date, selectedPlatforms: string[]) => {
    setIsPosting(true);
    setError(null);
    
    try {
      // Get current user's dealership ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get dealership directly from dealerships table instead of dealership_users
      const { data: dealerships } = await supabase
        .from('dealerships')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!dealerships) throw new Error('No dealership found for user');
      
      // Create scheduled post
      const scheduledPost = {
        user_id: user.id,
        dealership_id: dealerships.id,
        content: caption.content,
        image_urls: imageUrls,
        platforms: selectedPlatforms,
        scheduled_time: scheduledTime,
        metadata: {
          caption_id: caption.id,
          facebook_page_id: selectedPlatforms.includes('facebook') ? selectedFacebookPage : null
        }
      };
      
      const result = await createScheduledPost(scheduledPost);
      
      if (result) {
        setIsScheduled(true);
        setShowScheduler(false);
        
        if (onPost) {
          onPost(selectedPlatforms);
        }
      } else {
        throw new Error('Failed to schedule post');
      }
    } catch (err) {
      console.error('Error scheduling post:', err);
      setError('Failed to schedule post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };
  
  // Function to update vehicle_events with social media post information
  const updateVehicleEventWithSocialPost = async (vehicleId: number, platforms: string[]) => {
    try {
      // Check if there's an existing event for this vehicle
      const { data: existingEvents, error: fetchError } = await supabase
        .from('vehicle_events')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError) throw fetchError;
      
      // Prepare the update data
      const updateData: any = {
        posted_to_facebook: platforms.includes('facebook'),
        posted_to_instagram: platforms.includes('instagram'),
        posted_to_google: platforms.includes('google')
      };
      
      if (existingEvents && existingEvents.length > 0) {
        // Update the most recent event
        const { error } = await supabase
          .from('vehicle_events')
          .update(updateData)
          .eq('id', existingEvents[0].id);
          
        if (error) throw error;
        console.log('Updated existing vehicle event with social post info');
      } else {
        // Create a new event
        updateData.vehicle_id = vehicleId;
        updateData.event_type = 'social_post';
        updateData.notes = 'Posted to social media';
        
        const { error } = await supabase
          .from('vehicle_events')
          .insert(updateData);
          
        if (error) throw error;
        console.log('Created new vehicle event for social post');
      }
    } catch (err) {
      console.error('Error updating vehicle event with social post:', err);
    }
  };
  
  const handleImmediatePost = async () => {
    setIsPosting(true);
    setError(null);
    
    try {
      // Handle Facebook posting
      if (platforms.includes('facebook') && selectedFacebookPage) {
        const page = facebookPages.find(p => p.id === selectedFacebookPage);
        if (!page) {
          throw new Error('Selected Facebook page not found');
        }
        
        console.log('Posting to Facebook page:', page.name);
        console.log('Content:', caption.content);
        
        const result = await postToFacebookPage(
          page.id,
          page.access_token,
          caption.content,
          imageUrls
        );
        
        console.log('Facebook post result:', result);
        
        // Update caption with post ID
        if (result && caption.id) {
          await updateCaptionWithFacebookPost(Number(caption.id), result);
        }
        
        // Update vehicle event with social post info if we have a vehicle
        if (vehicle && vehicle.id) {
          await updateVehicleEventWithSocialPost(vehicle.id, platforms);
        }
      }
      
      // Handle other platforms here...
      
      if (onPost) {
        onPost(platforms);
      }
    } catch (err) {
      console.error('Error posting to social media:', err);
      setError('Failed to post to social media. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="social-post-form">
      <h2>Post to Social Media</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {isScheduled ? (
        <div className="success-message">
          Post scheduled successfully!
        </div>
      ) : showScheduler ? (
        <PostScheduler
          postContent={caption.content}
          imageUrls={imageUrls}
          platforms={platforms}
          onSchedule={handleSchedulePost}
          onCancel={() => setShowScheduler(false)}
        />
      ) : (
        <>
          <div className="platform-selection">
            <h3>Select Platforms</h3>
            <div className="platforms">
              <div 
                className={`platform ${platforms.includes('facebook') ? 'selected' : ''}`}
                onClick={() => handleTogglePlatform('facebook')}
              >
                <span className="platform-icon facebook">f</span>
                <span className="platform-name">Facebook</span>
                {!facebookConnected && <span className="connect-note">Click to connect</span>}
              </div>
              
              <div className="platform coming-soon">
                <span className="platform-icon instagram">i</span>
                <span className="platform-name">Instagram</span>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
              
              <div className="platform coming-soon">
                <span className="platform-icon google">g</span>
                <span className="platform-name">Google Business</span>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
            </div>
          </div>
          
          {facebookConnected && platforms.includes('facebook') && (
            <div className="facebook-options">
              <h3>Facebook Options</h3>
              <div className="form-group">
                <label>Select Page:</label>
                <select 
                  value={selectedFacebookPage}
                  onChange={(e) => setSelectedFacebookPage(e.target.value)}
                >
                  {facebookPages.map(page => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="post-preview">
            <h3>Post Content</h3>
            <div className="content-preview">
              {caption.content}
            </div>
            {imageUrls.length > 0 && (
              <div className="image-preview">
                {imageUrls.map((url, index) => (
                  <div key={index} className="preview-image-container">
                    <img src={url} alt="Preview" className="preview-image" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="post-actions">
            <button 
              className="post-button immediate primary"
              onClick={handleImmediatePost}
              disabled={isPosting || platforms.length === 0}
            >
              {isPosting ? 'Posting...' : 'Post Now'}
            </button>
            <div className="schedule-option">
              <button 
                className="post-button schedule secondary"
                disabled={true}
                title="Scheduling feature coming soon"
              >
                Schedule Post
              </button>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
