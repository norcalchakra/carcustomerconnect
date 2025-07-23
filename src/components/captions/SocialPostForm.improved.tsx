import React, { useState, useEffect } from 'react';
import { Caption, Vehicle, VehicleEvent, Dealership } from '../../lib/api';
import { mockInitFacebookSDK, mockIsFacebookConnected, mockLoginWithFacebook, mockGetUserPages, mockPostToFacebookPage } from '../../lib/mockFacebookApi';
import eventBus, { EVENTS } from '../../lib/eventBus';
import { socialPostsApi, SocialPostInsert } from '../../lib/socialPostsApi.improved';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateCaption, isOpenAIConfigured } from '../../lib/openaiApi';
import './SocialPostForm.improved.css';

interface SocialPostFormProps {
  caption: Caption;
  vehicle?: Vehicle;
  event?: VehicleEvent;
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
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [dealershipData, setDealershipData] = useState<Dealership | null>(null);
  const [isOpenAIAvailable, setIsOpenAIAvailable] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

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
        await mockInitFacebookSDK();
        const connected = mockIsFacebookConnected();
        setFacebookConnected(connected);
        
        if (connected) {
          // Try to get saved pages using the stored token
          const accessToken = localStorage.getItem('mock_fb_access_token');
          if (accessToken) {
            try {
              const pages = await mockGetUserPages(accessToken);
              setFacebookPages(pages);
              if (pages.length > 0) {
                setSelectedFacebookPage(pages[0].id);
              }
            } catch (err) {
              console.error('Error fetching Facebook pages:', err);
              localStorage.removeItem('mock_fb_access_token');
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
  
  // Function to handle image upload (mock implementation)
  const handleImageUpload = () => {
    // In a real implementation, this would open a file picker
    // For now, we'll just add a mock image URL
    const newImageUrl = `https://example.com/mock-image-${Date.now()}.jpg`;
    setImageUrls([...imageUrls, newImageUrl]);
  };
  
  // Function to remove an image
  const handleRemoveImage = (index: number) => {
    const newImageUrls = [...imageUrls];
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);
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
          
          <div className="image-section">
            <div className="image-header">
              <h4>Images</h4>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={handleImageUpload}
              >
                Add Image
              </button>
            </div>
            
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
              <div className="no-images">
                No images added. Posts with images typically get more engagement.
              </div>
            )}
          </div>
          
          <div className="notes-section">
            <div className="notes-header">
              <h4>Notes for AI</h4>
              <p className="notes-description">🎯 <strong>The AI will make this the main focus of your post.</strong> Enter the key topic you want to highlight (e.g., "brake service completed", "oil change special", "new arrival")</p>
            </div>
            
            <div className="notes-input-container">
              <textarea 
                className="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter the main topic for your post (e.g., 'brake service completed', 'oil change special')..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="caption-section">
            <div className="caption-header">
              <h4>Caption</h4>
            </div>
            
            <div className="caption-input-container">
              <textarea 
                className="caption-textarea"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your caption here..."
                rows={4}
              />
              
              <div className="caption-actions">
                <button 
                  className="btn btn-secondary ai-caption-btn"
                  onClick={async () => {
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
