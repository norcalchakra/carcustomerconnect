import React, { useState, useEffect } from 'react';
import * as mockFacebookApi from '../lib/mockFacebookApi';

const FacebookLoginTest: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [message, setMessage] = useState('This is a test post from Car Customer Connect!');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<{ message: string; isSuccess: boolean } | null>(null);

  useEffect(() => {
    const init = async () => {
      await mockFacebookApi.initMockFacebookSDK();
      setIsInitialized(true);
      
      // Check if already connected
      const connected = mockFacebookApi.mockIsFacebookConnected();
      setIsConnected(connected);
      
      if (connected) {
        loadPages();
      }
    };
    
    init();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setStatus(null);
      
      const accessToken = await mockFacebookApi.mockLoginWithFacebook();
      localStorage.setItem('mock_fb_access_token', accessToken);
      setIsConnected(true);
      
      await loadPages();
      
      setStatus({
        message: 'Successfully logged in to Facebook!',
        isSuccess: true
      });
    } catch (error) {
      setStatus({
        message: 'Failed to login to Facebook',
        isSuccess: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    mockFacebookApi.mockLogoutFromFacebook();
    setIsConnected(false);
    setPages([]);
    setSelectedPage(null);
    setStatus({
      message: 'Logged out from Facebook',
      isSuccess: true
    });
  };

  const loadPages = async () => {
    try {
      setIsLoading(true);
      
      // First try to get saved pages
      const savedPages = await mockFacebookApi.mockGetSavedFacebookPages();
      
      if (savedPages.length > 0) {
        setPages(savedPages);
        setSelectedPage(savedPages[0]);
      } else {
        // If no saved pages, get from API
        const accessToken = localStorage.getItem('mock_fb_access_token') || '';
        const userPages = await mockFacebookApi.mockGetUserPages(accessToken);
        setPages(userPages);
        
        if (userPages.length > 0) {
          setSelectedPage(userPages[0]);
          await mockFacebookApi.mockSaveFacebookPageToProfile(userPages[0]);
        }
      }
    } catch (error) {
      setStatus({
        message: 'Failed to load Facebook pages',
        isSuccess: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPage = (page: any) => {
    setSelectedPage(page);
    mockFacebookApi.mockSaveFacebookPageToProfile(page);
    setStatus({
      message: `Selected page: ${page.name}`,
      isSuccess: true
    });
  };

  const handlePost = async () => {
    if (!selectedPage) {
      setStatus({
        message: 'Please select a page first',
        isSuccess: false
      });
      return;
    }

    if (!message && !imageUrl) {
      setStatus({
        message: 'Please enter a message or provide an image URL',
        isSuccess: false
      });
      return;
    }

    try {
      setIsLoading(true);
      setStatus(null);
      
      const postId = await mockFacebookApi.mockPostToFacebookPage(
        selectedPage.id,
        selectedPage.access_token,
        message,
        imageUrl ? [imageUrl] : undefined
      );
      
      // Simulate updating a caption with the post ID
      await mockFacebookApi.mockUpdateCaptionWithFacebookPost(1, postId);
      
      setStatus({
        message: `Successfully posted to ${selectedPage.name}! Post ID: ${postId}`,
        isSuccess: true
      });
    } catch (error) {
      setStatus({
        message: 'Failed to post to Facebook',
        isSuccess: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Facebook Integration Test</h1>
      
      {status && (
        <div className={`p-4 mb-6 rounded-md ${status.isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.message}
        </div>
      )}
      
      <div className="space-y-8">
        {/* Step 1: Initialize */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-2">Step 1: Initialize Facebook SDK</h2>
          <p className="text-gray-600 mb-4">
            {isInitialized 
              ? '✅ Facebook SDK initialized successfully!' 
              : 'Initializing Facebook SDK...'}
          </p>
        </div>
        
        {/* Step 2: Login */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-2">Step 2: Login with Facebook</h2>
          <p className="text-gray-600 mb-4">
            {isConnected 
              ? '✅ Connected to Facebook' 
              : 'Not connected to Facebook'}
          </p>
          
          <button
            onClick={isConnected ? handleLogout : handleLogin}
            disabled={isLoading || !isInitialized}
            className={`px-4 py-2 rounded-md ${
              isConnected 
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Loading...' : (isConnected ? 'Disconnect' : 'Connect to Facebook')}
          </button>
        </div>
        
        {/* Step 3: Pages */}
        {isConnected && (
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-2">Step 3: Facebook Pages</h2>
            
            {pages.length === 0 ? (
              <p className="text-gray-600">No pages found.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600 mb-2">Select a page to post to:</p>
                
                {pages.map(page => (
                  <div 
                    key={page.id}
                    className={`flex items-center justify-between p-3 border rounded-md ${
                      selectedPage?.id === page.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-gray-500">{page.category}</p>
                    </div>
                    
                    <button
                      onClick={() => handleSelectPage(page)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      {selectedPage?.id === page.id ? 'Selected' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Step 4: Post */}
        {isConnected && selectedPage && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Step 4: Create a Post</h2>
            <p className="text-gray-600 mb-4">
              Posting to: <strong>{selectedPage.name}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  id="imageUrl"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={handlePost}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Posting...' : 'Post to Facebook'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t">
        <h3 className="font-semibold mb-2">How This Works</h3>
        <p className="text-gray-600">
          This is a mock implementation that simulates Facebook integration without requiring a real Facebook App ID.
          In a production environment, you would need to:
        </p>
        <ol className="list-decimal ml-5 mt-2 text-gray-600 space-y-1">
          <li>Create a Facebook Developer App</li>
          <li>Configure Facebook Login product</li>
          <li>Add your domain to allowed domains</li>
          <li>Use your real App ID instead of the mock implementation</li>
        </ol>
      </div>
    </div>
  );
};

export default FacebookLoginTest;
