import React, { useState, useEffect } from 'react';
import { Caption, Vehicle, VehicleEvent } from '../../lib/api';
// Import mock Facebook API instead of real one
import { 
  mockInitFacebookSDK as initFacebookSDK, 
  mockIsFacebookConnected as isFacebookConnected, 
  mockLoginWithFacebook as loginWithFacebook, 
  mockGetUserPages as getUserPages, 
  mockPostToFacebookPage as postToFacebookPage, 
  // Still use real function for database updates
  updateCaptionWithFacebookPost 
} from '../../lib/mockFacebookApi';

interface SocialPostFormProps {
  caption: Caption;
  vehicle?: Vehicle; // Made optional since we're not using it currently
  event?: VehicleEvent; // Made optional since we're not using it currently
  onPost?: (platforms: string[]) => void;
}

export const SocialPostForm: React.FC<SocialPostFormProps> = ({ 
  caption, 
  onPost 
}) => {
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [facebookConnected, setFacebookConnected] = useState<boolean>(false);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);

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

  const handlePost = async () => {
    try {
      setIsPosting(true);
      setError(null);
      
      const results = [];
      
      // Format the caption content with hashtags
      const fullCaption = caption.hashtags 
        ? `${caption.content}\n\n${caption.hashtags}` 
        : caption.content;
      
      // Post to each selected platform
      if (platforms.includes('facebook')) {
        if (!facebookConnected || !selectedFacebookPage) {
          throw new Error('Facebook is not properly connected');
        }
        
        // Find the selected page details
        const selectedPage = facebookPages.find(page => page.id === selectedFacebookPage);
        if (!selectedPage) {
          throw new Error('Selected Facebook page not found');
        }
        
        // Get image URLs if available
        const imageUrls = caption.image_urls || [];
        
        // Post to Facebook
        console.log('Posting to Facebook page:', selectedPage.name);
        const postId = await postToFacebookPage(
          selectedPage.id,
          selectedPage.access_token,
          fullCaption,
          imageUrls
        );
        
        // Update the caption record with Facebook post info
        if (caption.id) {
          await updateCaptionWithFacebookPost(caption.id, postId);
        }
        
        results.push(`Facebook (${selectedPage.name})`);
      }
      
      // Handle Instagram (placeholder for future implementation)
      if (platforms.includes('instagram')) {
        console.log('Instagram posting not yet implemented');
      }
      
      // Handle Google Business (placeholder for future implementation)
      if (platforms.includes('google')) {
        console.log('Google Business posting not yet implemented');
      }
      
      if (isScheduled && scheduleTime) {
        console.log('Scheduled for:', scheduleTime);
        // Scheduling functionality would be implemented here
      }
      
      if (onPost) {
        onPost(platforms);
      }
      
      // Show success message
      if (results.length > 0) {
        alert(`Successfully ${isScheduled ? 'scheduled' : 'posted'} to ${results.join(', ')}!`);
      } else {
        alert('No platforms were selected for posting.');
      }
    } catch (err) {
      console.error('Error posting to social media:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to post to social media: ${errorMessage}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">Post to Social Media</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Platforms
          </label>
          <div className="flex flex-wrap gap-3">
            <div 
              className={`flex items-center space-x-2 rounded-md border p-2 cursor-pointer ${
                platforms.includes('facebook') ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
              }`}
              onClick={() => handleTogglePlatform('facebook')}
            >
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">f</span>
              </div>
              <span className="text-sm">Facebook</span>
              {facebookConnected && (
                <span className="text-xs text-green-600 ml-1">(Connected)</span>
              )}
            </div>
            
            <div 
              className={`flex items-center space-x-2 rounded-md border p-2 cursor-pointer ${
                platforms.includes('instagram') ? 'bg-purple-50 border-purple-500' : 'border-gray-300 opacity-50'
              }`}
              onClick={() => alert('Instagram integration coming soon!')}
            >
              <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <span className="text-sm">Instagram</span>
              <span className="text-xs text-gray-500">(Coming Soon)</span>
            </div>
            
            <div 
              className={`flex items-center space-x-2 rounded-md border p-2 cursor-pointer ${
                platforms.includes('google') ? 'bg-green-50 border-green-500' : 'border-gray-300 opacity-50'
              }`}
              onClick={() => alert('Google Business integration coming soon!')}
            >
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                <span className="text-red-500 font-bold">G</span>
              </div>
              <span className="text-sm">Google Business</span>
              <span className="text-xs text-gray-500">(Coming Soon)</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="schedule"
            checked={isScheduled}
            onChange={() => setIsScheduled(!isScheduled)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <label htmlFor="schedule" className="ml-2 block text-sm text-gray-700">
            Schedule for later
          </label>
        </div>
        
        {isScheduled && (
          <div>
            <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Time
            </label>
            <input
              type="datetime-local"
              id="scheduleTime"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}
        
        {platforms.includes('facebook') && facebookPages.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Facebook Page
            </label>
            <select
              value={selectedFacebookPage}
              onChange={(e) => setSelectedFacebookPage(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              {facebookPages.map(page => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handlePost}
            disabled={isPosting || platforms.length === 0}
            className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 ${
              platforms.length === 0 
                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isPosting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{isScheduled ? 'Scheduling...' : 'Posting...'}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{isScheduled ? 'Schedule Post' : 'Post Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
