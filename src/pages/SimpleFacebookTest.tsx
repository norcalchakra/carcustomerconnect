import React, { useState } from 'react';
import * as mockFacebookApi from '../lib/mockFacebookApi';

const SimpleFacebookTest: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [message, setMessage] = useState('Test post from Car Customer Connect!');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setStatus('Logging in to Facebook...');
      
      // Use our mock implementation
      const token = await mockFacebookApi.mockLoginWithFacebook();
      localStorage.setItem('mock_fb_access_token', token);
      
      setAccessToken(token);
      setIsLoggedIn(true);
      setStatus('Successfully logged in to Facebook!');
      
      // Get pages
      const userPages = await mockFacebookApi.mockGetUserPages(token);
      setPages(userPages);
      
      if (userPages.length > 0) {
        setSelectedPage(userPages[0]);
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatus('Failed to login to Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mock_fb_access_token');
    setAccessToken(null);
    setIsLoggedIn(false);
    setPages([]);
    setSelectedPage(null);
    setStatus('Logged out from Facebook');
  };

  const handlePost = async () => {
    if (!selectedPage) {
      setStatus('Please select a page first');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Posting to Facebook...');
      
      const postId = await mockFacebookApi.mockPostToFacebookPage(
        selectedPage.id,
        selectedPage.access_token,
        message,
        imageUrl ? [imageUrl] : undefined
      );
      
      setStatus(`Successfully posted to Facebook! Post ID: ${postId}`);
    } catch (error) {
      console.error('Post error:', error);
      setStatus('Failed to post to Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Simple Facebook Test</h1>
      
      {status && (
        <div className="bg-blue-50 text-blue-700 p-4 mb-6 rounded-md">
          {status}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Facebook Connection</h2>
        
        {!isLoggedIn ? (
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect to Facebook'}
          </button>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">f</span>
              </div>
              <div className="ml-3">
                <p className="font-medium">Connected to Facebook</p>
                <p className="text-sm text-gray-500">Token: {accessToken?.substring(0, 10)}...</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
      
      {isLoggedIn && (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Facebook Pages</h2>
            
            {pages.length === 0 ? (
              <p>No pages found.</p>
            ) : (
              <div className="space-y-3">
                {pages.map(page => (
                  <div 
                    key={page.id}
                    className={`p-3 border rounded-md ${selectedPage?.id === page.id ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => setSelectedPage(page)}
                    style={{ cursor: 'pointer' }}
                  >
                    <p className="font-medium">{page.name}</p>
                    <p className="text-sm text-gray-500">{page.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create Post</h2>
            
            {selectedPage ? (
              <p className="mb-4">Posting to: <strong>{selectedPage.name}</strong></p>
            ) : (
              <p className="mb-4 text-yellow-600">Please select a page above</p>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <button
                onClick={handlePost}
                disabled={isLoading || !selectedPage}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Posting...' : 'Post to Facebook'}
              </button>
            </div>
          </div>
        </>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <p>This is a mock implementation for testing purposes only.</p>
        <p>No actual connection to Facebook is being made.</p>
      </div>
    </div>
  );
};

export default SimpleFacebookTest;
