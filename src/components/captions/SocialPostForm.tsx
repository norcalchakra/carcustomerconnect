import React, { useState, useEffect } from 'react';
import { Caption, Vehicle, VehicleEvent, Dealership } from '../../lib/api';
import { initFacebookSDK, isFacebookConnected, loginWithFacebook, getUserPages, postToFacebookPage } from '../../lib/hybridFacebookApi';
import eventBus, { EVENTS } from '../../lib/eventBus';
import { socialPostsApi, SocialPostInsert } from '../../lib/socialPostsApi.improved';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateCaption, isOpenAIConfigured } from '../../lib/openaiApi';
import ImageCapture from './ImageCapture';
import ImageProxy from '../common/ImageProxy';
import './SocialPostForm.improved.css';
import '../common/ImageProxy.css';
import '../../styles/retro-comic-theme.css';

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
  const [storageUrls, setStorageUrls] = useState<(string | null)[]>([]);
  const [postContent, setPostContent] = useState<string>(caption.content);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [dealershipData, setDealershipData] = useState<Dealership | null>(null);
  const [isOpenAIAvailable, setIsOpenAIAvailable] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  
  // Action bubble animation trigger function
  const triggerActionBubble = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.classList.remove('triggered');
    // Force reflow to ensure the class is removed before adding it back
    element.offsetHeight;
    element.classList.add('triggered');
    
    // Remove the class after animation completes
    setTimeout(() => {
      element.classList.remove('triggered');
    }, 600);
  };
  
  // Random action bubble generator for AI Generate button
  const getRandomActionBubble = () => {
    const bubbles = ['pow', 'bam', 'zoom', 'wham', 'kapow', 'zap'];
    return bubbles[Math.floor(Math.random() * bubbles.length)];
  };
  
  // Character limits removed as they're no longer needed after removing the content editing section

  // Fetch dealership ID and data for the current user
  useEffect(() => {
    const getDealershipData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('dealerships')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          setDealershipId(data.id);
          setDealershipData(data as Dealership);
        }
      } catch (err) {
        console.error('Error fetching dealership data:', err);
      }
    };
    
    getDealershipData();
  }, [user]);
  
  // Check if OpenAI API is configured
  useEffect(() => {
    const checkOpenAIConfig = async () => {
      try {
        const available = await isOpenAIConfigured();
        setIsOpenAIAvailable(available);
      } catch (err) {
        console.error('Error checking OpenAI configuration:', err);
        setIsOpenAIAvailable(false);
      }
    };
    
    checkOpenAIConfig();
  }, []);

  // Caption content is initialized in the state declaration

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

  const toggleScheduler = () => {
    setShowScheduler(!showScheduler);
    // Reset scheduled state when toggling scheduler
    if (isScheduled) {
      setIsScheduled(false);
    }
  };

  // Function to create a social media post record
  const createSocialPost = async (platform: string, content: string, postId: string, vehicleId?: number) => {
    try {
      if (!dealershipId) {
        console.error('No dealership ID available');
        return false;
      }

      // Process image URLs before saving
      // Use the storage URLs if available, otherwise use placeholders
      const processedImageUrls = imageUrls.map((previewUrl, index) => {
        // If we have a storage URL for this image, use it
        if (storageUrls[index]) {
          console.log('Using Supabase storage URL for database:', storageUrls[index]);
          return storageUrls[index] as string;
        }
        
        // If the preview URL is a blob URL but we don't have a storage URL,
        // we need to use a placeholder since blob URLs won't persist
        if (previewUrl.startsWith('blob:')) {
          const placeholder = `temp-image-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          console.log('Using placeholder for blob URL:', placeholder);
          return placeholder;
        }
        
        // For any other type of URL, just use it as is
        return previewUrl;
      });

      // Generate a mock post URL based on the platform
      const postUrl = platform === 'facebook' 
        ? `https://facebook.com/posts/${postId}` 
        : platform === 'instagram'
          ? `https://instagram.com/p/${postId}`
          : `https://business.google.com/posts/${postId}`;

      const socialPost: SocialPostInsert = {
        dealership_id: dealershipId,
        content: content,
        platform: platform,
        post_id: postId,
        post_url: postUrl,
        image_urls: processedImageUrls,
        status: 'posted',
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      if (vehicleId) {
        socialPost.vehicle_id = vehicleId;
      }

      const result = await socialPostsApi.create(socialPost);
      
      console.log('Social post record created:', result);
      
      // Emit event to notify other components that a social post was created
      console.log('Emitting SOCIAL_POST_CREATED event');
      eventBus.emit(EVENTS.SOCIAL_POST_CREATED, { vehicleId, platform });
      
      if (!result) {
        console.error('Error creating social post record');
        return false;
      }
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
        console.log('Image URLs being sent to Facebook:', imageUrls);
        console.log('Storage URLs available:', storageUrls);
        
        // Use actual image URLs instead of placeholders
        const actualImageUrls = imageUrls.filter(url => {
          // Filter out placeholder URLs and blob URLs that can't be used by Facebook
          return url && !url.startsWith('temp-image-') && !url.startsWith('blob:');
        });
        
        // If we have blob URLs, we need to use the storage URLs instead
        const finalImageUrls = [];
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const storageUrl = storageUrls[i];
          
          if (imageUrl.startsWith('blob:') && storageUrl) {
            // Use the storage URL for blob images
            finalImageUrls.push(storageUrl);
            console.log(`Using storage URL for blob image: ${storageUrl}`);
          } else if (!imageUrl.startsWith('temp-image-') && !imageUrl.startsWith('blob:')) {
            // Use the original URL for non-blob images
            finalImageUrls.push(imageUrl);
            console.log(`Using original URL: ${imageUrl}`);
          } else {
            console.warn(`Skipping unusable image URL: ${imageUrl}`);
          }
        }
        
        console.log('Final image URLs for Facebook:', finalImageUrls);
        
        const result = await postToFacebookPage(
          page.id,
          page.access_token,
          postContent,
          finalImageUrls
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
  const handleImageCaptured = (previewUrl: string, storageUrl: string | null) => {
    console.log('Image captured/uploaded - Preview URL:', previewUrl);
    console.log('Storage URL for database:', storageUrl);
    setImageUrls([...imageUrls, previewUrl]);
    setStorageUrls([...storageUrls, storageUrl]);
  };

  // Function to remove an image
  const handleRemoveImage = (index: number) => {
    const newImageUrls = [...imageUrls];
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);
  };

  // Content editing functions removed as they're no longer needed

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
                className={`action-bubble action-bubble-bam platform ${platforms.includes('facebook') ? 'selected' : ''}`}
                onClick={(e) => {
                  triggerActionBubble(e);
                  handleTogglePlatform('facebook');
                }}
                data-action="BAM!"
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
              <div className="riddler-form-group">
                <label className="riddler-label">Select Page:</label>
                <select 
                  value={selectedFacebookPage}
                  onChange={(e) => setSelectedFacebookPage(e.target.value)}
                  className="riddler-select"
                >
                  {facebookPages.map(page => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </div>
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
                    <ImageProxy 
                      src={url} 
                      alt="Preview" 
                      className="preview-image"
                    />
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
          
          <div className="notes-section">
            <div className="notes-header">
              <h4>Notes for AI</h4>
              <p className="notes-description">🎯 <strong>The AI will make this the main focus of your post.</strong> Enter the key topic you want to highlight (e.g., "brake service completed", "oil change special", "new arrival")</p>
            </div>
            
            <div className="riddler-input-wrapper notes-input-container">
              <textarea 
                className="riddler-input riddler-textarea notes-textarea"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  // Add typing animation
                  e.target.classList.add('typing');
                  setTimeout(() => e.target.classList.remove('typing'), 1500);
                }}
                onFocus={(e) => e.target.classList.add('typing')}
                onBlur={(e) => e.target.classList.remove('typing')}
                placeholder="Enter the main topic for your post (e.g., 'brake service completed', 'oil change special')..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="caption-section">
            <div className="caption-header">
              <h4>Caption</h4>
            </div>
            
            <div className="riddler-input-wrapper caption-input-container">
              <textarea 
                className="riddler-input riddler-textarea caption-textarea"
                value={postContent}
                onChange={(e) => {
                  setPostContent(e.target.value);
                  // Add typing animation
                  e.target.classList.add('typing');
                  setTimeout(() => e.target.classList.remove('typing'), 1500);
                  // Update wrapper class based on content
                  const wrapper = e.target.closest('.riddler-input-wrapper');
                  if (wrapper) {
                    if (e.target.value.trim()) {
                      wrapper.classList.add('has-content');
                    } else {
                      wrapper.classList.remove('has-content');
                    }
                  }
                }}
                onFocus={(e) => e.target.classList.add('typing')}
                onBlur={(e) => e.target.classList.remove('typing')}
                placeholder="Write your caption here..."
                rows={4}
              />
              
              <div className="caption-actions">
                <button 
                  className={`riddler-button action-bubble action-bubble-${getRandomActionBubble()} btn btn-secondary ai-caption-btn`}
                  onClick={async (e) => {
                    triggerActionBubble(e);
                    setIsGeneratingCaption(true);
                    try {
                      if (!vehicle) {
                        // Handle missing vehicle data gracefully
                        setError('Vehicle information is missing. Using generic caption instead.');
                        setPostContent("Check out this amazing vehicle at our dealership! #carcustomerconnect #newcar");
                        return;
                      }
                      
                      // Generate caption using OpenAI with RAG from dealer and vehicle information
                      // Include notes as additional context if provided
                      const additionalContext = notes.trim() ? `${caption.content}\n\nSpecific details: ${notes}` : caption.content;
                      const generatedCaption = await generateCaption(
                        vehicle, 
                        dealershipData,
                        additionalContext
                      );
                      
                      setPostContent(generatedCaption);
                    } catch (err) {
                      console.error('Error generating caption with AI:', err);
                      setError(`Failed to generate caption: ${err instanceof Error ? err.message : 'Unknown error'}`);
                      // Fallback to a generic caption if AI fails
                      setPostContent("Check out this amazing vehicle at our dealership! #carcustomerconnect #newcar");
                    } finally {
                      setIsGeneratingCaption(false);
                    }
                  }}
                  disabled={isGeneratingCaption}
                  title={!isOpenAIAvailable ? 'OpenAI API not configured' : !vehicle ? 'Vehicle information required' : notes.trim() ? `Generate caption focused on: ${notes}` : 'Generate caption with AI'}
                  data-action={['POW!', 'ZAP!', 'BOOM!', 'WHAM!'][Math.floor(Math.random() * 4)]}
                >
                  {isGeneratingCaption ? 'Generating...' : notes.trim() ? `Generate Caption About: ${notes.slice(0, 20)}${notes.length > 20 ? '...' : ''}` : 'Generate with AI'}
                </button>
                <div className="character-count">
                  {postContent.length} characters
                </div>
              </div>
            </div>
          </div>
          
          <div className="post-actions">
            <button 
              className="riddler-button btn btn-primary post-now-btn"
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
