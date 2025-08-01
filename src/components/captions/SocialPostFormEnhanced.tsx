import React, { useState, useEffect } from 'react';
import { Caption, Vehicle, VehicleEvent, Dealership, vehiclesApi } from '../../lib/api';
import { initFacebookSDK, isFacebookConnected, loginWithFacebook, getUserPages, postToFacebookPage } from '../../lib/hybridFacebookApi';
import eventBus, { EVENTS } from '../../lib/eventBus';
import { socialPostsApi, SocialPostInsert } from '../../lib/socialPostsApi.improved';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateCaption, generateVehicleAgnosticCaption, isOpenAIConfigured } from '../../lib/openaiApi';
import ImageCapture from './ImageCapture';
import ImageProxy from '../common/ImageProxy';
import StatusTransitionPrompt from '../vehicles/StatusTransitionPrompt';
import './SocialPostForm.improved.css';
import '../common/ImageProxy.css';
import '../../styles/retro-comic-theme.css';

interface SocialPostFormEnhancedProps {
  caption: Caption;
  vehicle?: Vehicle;
  event?: VehicleEvent;
  onPost?: (platforms: string[]) => void;
  onVehicleStatusChange?: (vehicle: Vehicle) => void;
}

export const SocialPostFormEnhanced: React.FC<SocialPostFormEnhancedProps> = ({ 
  caption, 
  vehicle,
  onPost,
  onVehicleStatusChange
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
  const [aiNotes, setAiNotes] = useState<string>('');

  // Action bubble animation functions
  const triggerActionBubble = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;

    // Get button position for fixed positioning
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Update CSS custom properties for positioning
    button.style.setProperty('--bubble-x', `${centerX}px`);
    button.style.setProperty('--bubble-y', `${centerY}px`);

    button.classList.add('triggered');

    setTimeout(() => {
      button.classList.remove('triggered');
    }, 600);
  };
  
  // Random action bubble generator for AI Generate button
  const getRandomActionBubble = () => {
    const bubbles = ['pow', 'bam', 'zoom', 'wham', 'kapow', 'zap'];
    return bubbles[Math.floor(Math.random() * bubbles.length)];
  };
  
  // New state for status transition workflow
  const [showStatusPrompt, setShowStatusPrompt] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | undefined>(vehicle);

  // Handle image capture callback
  const handleImageCaptured = (previewUrl: string, storageUrl: string | null) => {
    setImageUrls(prev => [...prev, previewUrl]);
    setStorageUrls(prev => [...prev, storageUrl]);
  };
  const [justPosted, setJustPosted] = useState(false);

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

  // Update current vehicle state when prop changes
  useEffect(() => {
    setCurrentVehicle(vehicle);
  }, [vehicle]);

  // Initialize Mock Facebook SDK on component mount
  useEffect(() => {
    const initFacebook = async () => {
      try {
        await initFacebookSDK();
        const connected = isFacebookConnected();
        setFacebookConnected(connected);
        
        if (connected) {
          const accessToken = localStorage.getItem('mock_fb_access_token');
          if (accessToken) {
            const pages = await getUserPages(accessToken);
            setFacebookPages(pages);
            if (pages.length > 0) {
              setSelectedFacebookPage(pages[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing Facebook SDK:', error);
      }
    };
    
    initFacebook();
  }, []);

  const createSocialPost = async (
    platform: string, 
    content: string, 
    postId: string, 
    vehicleId?: number
  ): Promise<boolean> => {
    if (!dealershipId) {
      console.error('No dealership ID available');
      return false;
    }

    try {
      const processedImageUrls = storageUrls.filter((url): url is string => url !== null);

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
        
        // Use actual storage URLs instead of blob URLs for Facebook
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
          result,
          currentVehicle?.id
        );
        
        if (createSuccess) {
          console.log('Social post record created successfully');
          setSuccess('Post successfully shared on Facebook!');
          setJustPosted(true);
          
          // Show status transition prompt if we have a vehicle
          if (currentVehicle) {
            setTimeout(() => {
              setShowStatusPrompt(true);
            }, 1500); // Show prompt after success message
          }
          
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
      
      if (onPost) {
        onPost(platforms);
      }
      
    } catch (error) {
      console.error('Error posting to social media:', error);
      setError('Failed to post to social media. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleStatusChange = async (newStatus: Vehicle['status'], statusNotes?: string) => {
    if (!currentVehicle) return;

    try {
      // Update vehicle status in the database
      const updatedVehicle = await vehiclesApi.update(currentVehicle.id, {
        ...currentVehicle,
        status: newStatus
      });

      if (updatedVehicle) {
        setCurrentVehicle(updatedVehicle);
        
        // Create a vehicle event for the status change
        const eventData = {
          vehicle_id: currentVehicle.id,
          event_type: 'status_change',
          description: `Status changed from ${currentVehicle.status} to ${newStatus}${statusNotes ? ` - ${statusNotes}` : ''}`,
          event_date: new Date().toISOString(),
          metadata: {
            previous_status: currentVehicle.status,
            new_status: newStatus,
            triggered_by: 'social_post',
            notes: statusNotes
          }
        };

        // You would call your vehicle events API here
        console.log('Creating vehicle event:', eventData);
        
        // Notify parent component about the vehicle update
        if (onVehicleStatusChange) {
          onVehicleStatusChange(updatedVehicle);
        }

        // Emit event for dashboard refresh
        eventBus.emit(EVENTS.ACTIVITY_UPDATED);
        
        setShowStatusPrompt(false);
        setSuccess(`Vehicle status updated to ${newStatus}!`);
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      setError('Failed to update vehicle status. Please try again.');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const token = await loginWithFacebook();
      if (token) {
        setFacebookConnected(true);
        const pages = await getUserPages(token);
        setFacebookPages(pages);
        if (pages.length > 0) {
          setSelectedFacebookPage(pages[0].id);
        }
      } else {
        setError('Failed to connect to Facebook');
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      setError('Failed to connect to Facebook');
    }
  };

  const handlePlatformChange = (platform: string) => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerateCaption = async () => {
    if (!dealershipData) {
      setError('Dealership data not available for caption generation');
      return;
    }

    setIsGeneratingCaption(true);
    setError(null);

    try {
      // Format the AI notes as additional context for the prompt
      let additionalContext = '';
      if (aiNotes.trim()) {
        additionalContext = `Specific details: ${aiNotes.trim()}`;
      }

      let generatedCaption;
      let promptInfo;

      if (currentVehicle) {
        // Vehicle-specific caption generation
        promptInfo = {
          type: 'vehicle-specific',
          vehicle: currentVehicle,
          dealership: dealershipData,
          additionalContext
        };
        console.log('AI Generate - Vehicle-specific prompt info:', promptInfo);
        generatedCaption = await generateCaption(
          currentVehicle, 
          dealershipData, 
          additionalContext
        );
      } else {
        // Vehicle-agnostic caption generation
        promptInfo = {
          type: 'vehicle-agnostic',
          dealership: dealershipData,
          additionalContext
        };
        console.log('AI Generate - Vehicle-agnostic prompt info:', promptInfo);
        generatedCaption = await generateVehicleAgnosticCaption(
          dealershipData,
          additionalContext
        );
      }

      console.log('AI Generate - Generated caption:', generatedCaption);
      setPostContent(generatedCaption);
      
      // Manually trigger Joker CSS styling for AI-generated content
      setTimeout(() => {
        const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
        const wrapper = textarea?.closest('.riddler-input-wrapper');
        if (wrapper && generatedCaption.trim()) {
          wrapper.classList.add('has-content');
          // Add typing animation to show the AI generation effect
          textarea?.classList.add('typing');
          setTimeout(() => textarea?.classList.remove('typing'), 1500);
        }
      }, 100);
      
      setSuccess('Caption generated successfully!');
    } catch (error) {
      console.error('Error generating caption:', error);
      setError('Failed to generate caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  return (
    <div className="social-post-form-enhanced">
      <div className="form-header">
        <h3>Share Your Post</h3>
        {currentVehicle && (
          <div className="vehicle-context">
            <span className="vehicle-name">
              {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
            </span>
            <span className={`status-indicator status-${currentVehicle.status}`}>
              {currentVehicle.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && !showStatusPrompt && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {success}
        </div>
      )}

      {/* Platform Selection */}
      <div className="platform-selection">
        <h4>Select Platforms</h4>
        <div className="platform-options">
          <label className={`platform-option ${platforms.includes('facebook') ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={platforms.includes('facebook')}
              onChange={() => handlePlatformChange('facebook')}
            />
            <span className="platform-icon">📘</span>
            <span className="platform-name">Facebook</span>
            {facebookConnected && <span className="connected-indicator">Connected</span>}
          </label>
          
          <label className="platform-option disabled">
            <input type="checkbox" disabled />
            <span className="platform-icon">📷</span>
            <span className="platform-name">Instagram</span>
            <span className="coming-soon">Coming Soon</span>
          </label>
          
          <label className="platform-option disabled">
            <input type="checkbox" disabled />
            <span className="platform-icon">🏢</span>
            <span className="platform-name">Google Business</span>
            <span className="coming-soon">Coming Soon</span>
          </label>
        </div>
      </div>

      {/* Facebook Page Selection */}
      {platforms.includes('facebook') && facebookConnected && facebookPages.length > 0 && (
        <div className="facebook-page-selection">
          <label htmlFor="facebook-page">Select Facebook Page:</label>
          <select
            id="facebook-page"
            value={selectedFacebookPage}
            onChange={(e) => setSelectedFacebookPage(e.target.value)}
            className="riddler-select"
          >
            {facebookPages.map(page => (
              <option key={page.id} value={page.id}>{page.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Facebook Login */}
      {platforms.includes('facebook') && !facebookConnected && (
        <div className="facebook-login">
          <button onClick={handleFacebookLogin} className="facebook-login-button">
            Connect to Facebook
          </button>
        </div>
      )}

      {/* Notes for AI */}
      <div className="ai-notes-section">
        <div className="ai-notes-header">
          <label htmlFor="ai-notes">
            <span className="ai-notes-icon">🎯</span>
            Notes for AI
          </label>
          <span className="ai-notes-description">
            The AI will make this the main focus of your post. Enter the key topic you want to highlight
          </span>
        </div>
        <div className="riddler-input-wrapper notes-input-container">
          <input
            id="ai-notes"
            type="text"
            value={aiNotes}
            onChange={(e) => {
              setAiNotes(e.target.value);
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
            placeholder="e.g., brake service completed, oil change special, new arrival"
            className="ai-notes-input riddler-input"
          />
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content-section">
        <div className="content-header">
          <label htmlFor="post-content">Post Content:</label>
          {isOpenAIAvailable && dealershipData && (
            <button
              onClick={async (e) => {
                // Set random action bubble class and data-action on click
                const randomBubble = getRandomActionBubble();
                const randomAction = ['POW!', 'ZAP!', 'BOOM!', 'WHAM!'][Math.floor(Math.random() * 4)];
                e.currentTarget.className = `generate-caption-button riddler-button action-bubble action-bubble-${randomBubble}`;
                e.currentTarget.setAttribute('data-action', randomAction);
                
                triggerActionBubble(e);
                await handleGenerateCaption();
              }}
              disabled={isGeneratingCaption}
              className="generate-caption-button riddler-button action-bubble action-bubble-pow"
              data-action="POW!"
            >
              {isGeneratingCaption ? 'Generating...' : '✨ AI Generate'}
            </button>
          )}
        </div>
        <div className="riddler-input-wrapper caption-input-container">
          <textarea
            id="post-content"
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
            rows={4}
            placeholder="Write your post content here..."
            className="riddler-input riddler-textarea caption-textarea"
          />
        </div>
      </div>

      {/* Image Capture */}
      <div className="image-section">
        <h4>Add Images</h4>
        <ImageCapture
          onImageCaptured={handleImageCaptured}
          dealershipId={dealershipId}
        />
        
        {imageUrls.length > 0 && (
          <div className="image-preview">
            <h5>Preview:</h5>
            <div className="preview-grid">
              {imageUrls.map((url, index) => (
                <ImageProxy key={index} src={url} alt={`Preview ${index + 1}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          onClick={(e) => {
            // Set random action bubble class and data-action on click
            const randomBubble = getRandomActionBubble();
            const randomAction = ['POW!', 'ZAP!', 'BOOM!', 'WHAM!'][Math.floor(Math.random() * 4)];
            e.currentTarget.className = `post-now-button riddler-button action-bubble action-bubble-${randomBubble}`;
            e.currentTarget.setAttribute('data-action', randomAction);
            
            triggerActionBubble(e);
            handleImmediatePost();
          }}
          disabled={isPosting || platforms.length === 0}
          className="post-now-button riddler-button action-bubble action-bubble-bam"
          data-action="BAM!"
        >
          {isPosting ? 'Posting...' : 'Post Now'}
        </button>
        
        <button
          onClick={(e) => {
            // Set random action bubble class on click
            const randomBubble = getRandomActionBubble();
            e.currentTarget.className = `schedule-button disabled riddler-button action-bubble action-bubble-${randomBubble}`;
            e.currentTarget.setAttribute('data-action', 'SOON!');
            
            triggerActionBubble(e);
            setShowScheduler(!showScheduler);
          }}
          disabled
          className="schedule-button disabled riddler-button action-bubble action-bubble-zoom"
          data-action="SOON!"
        >
          📅 Schedule Post <span className="coming-soon-label">(Coming Soon)</span>
        </button>
      </div>

      {/* Status Transition Prompt */}
      {currentVehicle && (
        <StatusTransitionPrompt
          vehicle={currentVehicle}
          onStatusChange={handleStatusChange}
          onDismiss={() => setShowStatusPrompt(false)}
          isVisible={showStatusPrompt}
        />
      )}
    </div>
  );
};

export default SocialPostFormEnhanced;
