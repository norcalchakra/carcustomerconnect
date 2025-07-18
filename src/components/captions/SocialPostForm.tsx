import React, { useState, useEffect, useRef } from 'react';
import { Caption, Vehicle, VehicleEvent } from '../../lib/api';
import { mockInitFacebookSDK, mockIsFacebookConnected, mockLoginWithFacebook, mockGetUserPages, mockPostToFacebookPage } from '../../lib/mockFacebookApi';
import eventBus, { EVENTS } from '../../lib/eventBus';
import { socialPostsApi, SocialPostInsert } from '../../lib/socialPostsApi.improved';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ImageCapture from './ImageCapture';
import './SocialPostForm.improved.css';

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
  const { user } = useAuth();
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [facebookConnected, setFacebookConnected] = useState<boolean>(false);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [postContent, setPostContent] = useState<string>(caption.content);
  const [characterCount, setCharacterCount] = useState<number>(caption.content.length);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  // Character limits for different platforms
  const CHAR_LIMITS = {
    facebook: 5000,
    instagram: 2200,
    google: 1500
  };
  
  // Get the most restrictive character limit based on selected platforms
  const getCharacterLimit = () => {
    if (platforms.length === 0) return CHAR_LIMITS.facebook;
    return Math.min(...platforms.map(p => CHAR_LIMITS[p as keyof typeof CHAR_LIMITS]));
  };

  // Fetch dealership ID for the current user
  useEffect(() => {
    const getDealershipId = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('dealerships')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) setDealershipId(data.id);
      } catch (err) {
        console.error('Error fetching dealership:', err);
        setError('Failed to load dealership information');
      }
    };
    
    getDealershipId();
  }, [user]);

  // Initialize content from caption
  useEffect(() => {
    setPostContent(caption.content);
    setCharacterCount(caption.content.length);
  }, [caption]);

  // Initialize Mock Facebook SDK on component mount
  useEffect(() => {
    const initFacebook = async () => {
      try {
        await mockInitFacebookSDK();
        const connected = mockIsFacebookConnected();
        setFacebookConnected(connected);
        
        if (connected) {
          // Try to get saved pages using the stored token
          const accessToken = localStorage.getItem('mock_fb_access_token'); // Use mock storage key
          if (accessToken) {
            try {
              const pages = await mockGetUserPages(accessToken);
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
      const accessToken = await mockLoginWithFacebook();
      console.log('Got mock access token:', accessToken);
      const pages = await mockGetUserPages(accessToken);
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

  const toggleScheduler = () => {
    setShowScheduler(!showScheduler);
    // Reset scheduled state when toggling scheduler
    if (isScheduled) {
      setIsScheduled(false);
    }
  };

  // Function to create a social media post record
  const createSocialPost = async (platform: string, content: string, postId: string, vehicleId?: number): Promise<boolean> => {
    try {
      if (!dealershipId) {
        console.error('No dealership ID available');
        return false;
      }
      
      console.log(`Creating social post record for platform: ${platform}`);
      
      // Generate a mock post URL based on the platform
      const postUrl = platform === 'facebook' 
        ? `https://facebook.com/posts/${postId}` 
        : platform === 'instagram'
          ? `https://instagram.com/p/${postId}`
          : `https://business.google.com/posts/${postId}`;
      
      const socialPost: SocialPostInsert = {
        dealership_id: dealershipId,
        vehicle_id: vehicleId,
        content: content,
        platform: platform,
        post_id: postId,
        post_url: postUrl,
        image_urls: imageUrls,
        status: 'posted',
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };
      
      const result = await socialPostsApi.create(socialPost);
      
      console.log('Social post record created:', result);
      
      // Emit event to notify other components that a social post was created
      console.log('Emitting SOCIAL_POST_CREATED event');
      eventBus.emit(EVENTS.SOCIAL_POST_CREATED, { vehicleId, platform });
      
      return true;
    } catch (error) {
      console.error('Error in createSocialPost:', error);
      return false;
    }
  };

  const handleImmediatePost = async () => {
    if (platforms.length === 0) {
      setError('Please select at least one platform to post to');
      return;
    }
    
    setIsPosting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Handle Facebook posting
      if (platforms.includes('facebook') && selectedFacebookPage) {
        const page = facebookPages.find(p => p.id === selectedFacebookPage);
        
        if (!page) {
          setError('Selected Facebook page not found');
          setIsPosting(false);
          return;
        }
        
        console.log('Posting to Facebook page:', page.name);
        
        const result = await mockPostToFacebookPage(
          page.id,
          page.access_token,
          postContent,
          imageUrls
        );
        
        console.log('Post created successfully:', result);
        
        // Create a social post record
        const createSuccess = await createSocialPost(
          'facebook',
          postContent,
          result, // mockPostToFacebookPage returns a string post ID
          vehicle?.id
        );
        
        if (createSuccess) {
          console.log('Social post record created successfully');
          setSuccess('Post successfully shared on Facebook!');
          // Notify any listeners that activity has been updated
          console.log('Emitting ACTIVITY_UPDATED event');
          eventBus.emit(EVENTS.ACTIVITY_UPDATED);
        } else {
          console.error('Failed to create social post record');
          setError('Post was created on Facebook but failed to update local record');
        }
      } else if (platforms.includes('facebook')) {
        setError('Please select a Facebook page to post to');
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

  // Function to handle image capture from camera or file upload
  const handleImageCaptured = (imageUrl: string) => {
    console.log('Image captured/uploaded:', imageUrl);
    setImageUrls([...imageUrls, imageUrl]);
  };

  // Function to remove an image
  const handleRemoveImage = (index: number) => {
    const newImageUrls = [...imageUrls];
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    // Focus the textarea when entering edit mode
    if (!isEditing && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.focus();
      }, 0);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setPostContent(newContent);
    setCharacterCount(newContent.length);
  };

  return (
    <div className="social-post-form">
      <h2>Post to Social Media</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      {isScheduled ? (
        <div className="success-message">
          Post scheduled successfully!
        </div>
      ) : showScheduler ? (
        <div className="scheduler-container">
          <h3>Schedule Your Post</h3>
          <p className="coming-soon">Coming Soon! Post scheduling will be available in a future update.</p>
          <div className="scheduler-actions">
            <button 
              className="btn btn-secondary"
              onClick={toggleScheduler}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                // Simulate scheduling success for demo purposes
                setIsScheduled(true);
                setShowScheduler(false);
              }}
              disabled={true} // Disabled since it's a coming soon feature
            >
              Schedule (Coming Soon)
            </button>
          </div>
        </div>
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
                  className="form-select"
                >
                  {facebookPages.map(page => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="post-preview">
            <div className="content-header">
              <h3>Post Content</h3>
              <button 
                className="btn btn-sm btn-outline-primary edit-btn"
                onClick={toggleEditMode}
              >
                {isEditing ? 'Done Editing' : 'Edit Content'}
              </button>
            </div>
            
            {isEditing ? (
              <div className="content-editor">
                <textarea
                  ref={contentRef}
                  value={postContent}
                  onChange={handleContentChange}
                  className="content-textarea"
                  maxLength={getCharacterLimit()}
                />
                <div className="character-count">
                  <span className={characterCount > getCharacterLimit() * 0.9 ? 'near-limit' : ''}>
                    {characterCount} / {getCharacterLimit()} characters
                  </span>
                </div>
              </div>
            ) : (
              <div className="content-preview">
                {postContent}
              </div>
            )}
            
            <div className="image-section">
              <div className="image-header">
                <h4>Images</h4>
              </div>
              
              <ImageCapture 
                onImageCaptured={handleImageCaptured}
                dealershipId={dealershipId}
              />
              
              {imageUrls.length > 0 ? (
                <div className="image-preview">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="preview-image-container">
                      <img src={url} alt="Preview" className="preview-image" />
                      <button 
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-images">No images added yet. Use the camera or upload from your device.</div>
              )}
            </div>
          </div>
          
          <div className="post-actions">
            <button 
              className="btn btn-primary post-now-btn"
              onClick={handleImmediatePost}
              disabled={isPosting || platforms.length === 0}
            >
              {isPosting ? 'Posting...' : 'Post Now'}
            </button>
            
            <button 
              className="btn btn-outline-primary schedule-btn"
              onClick={toggleScheduler}
              disabled={platforms.length === 0 || isPosting}
            >
              <span className="coming-soon-badge">Coming Soon</span>
              Schedule Post
            </button>
          </div>
        </>
      )}
    </div>
  );
};
