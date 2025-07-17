import React, { useState, useEffect } from 'react';
import { 
  initFacebookSDK, 
  loginWithFacebook, 
  getUserPages, 
  getSavedFacebookPages,
  saveFacebookPageToProfile,
  logoutFromFacebook
} from '../../lib/facebookApi';

export const SocialMediaSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const initSocialMedia = async () => {
      try {
        setIsLoading(true);
        await initFacebookSDK();
        
        // Check if we have a stored token
        const token = localStorage.getItem('fb_access_token');
        if (token) {
          setFacebookConnected(true);
          
          // Try to load saved pages
          try {
            const savedPages = await getSavedFacebookPages();
            if (savedPages.length > 0) {
              setFacebookPages(savedPages);
            } else {
              // If no saved pages, try to fetch from Facebook
              const pages = await getUserPages(token);
              setFacebookPages(pages);
            }
          } catch (err) {
            console.error('Error loading Facebook pages:', err);
            // Token might be expired, clear it
            localStorage.removeItem('fb_access_token');
            setFacebookConnected(false);
          }
        }
      } catch (err) {
        console.error('Error initializing social media:', err);
        setError('Failed to initialize social media connections');
      } finally {
        setIsLoading(false);
      }
    };
    
    initSocialMedia();
  }, []);

  const handleConnectFacebook = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      const accessToken = await loginWithFacebook();
      const pages = await getUserPages(accessToken);
      
      setFacebookPages(pages);
      setFacebookConnected(true);
      
      // Save the first page by default
      if (pages.length > 0) {
        await saveFacebookPageToProfile(pages[0]);
        setSuccess('Successfully connected to Facebook and saved page: ' + pages[0].name);
      } else {
        setError('No Facebook pages found. Please create a Facebook page for your dealership.');
      }
    } catch (err) {
      console.error('Facebook connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to connect to Facebook: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectFacebook = () => {
    try {
      logoutFromFacebook();
      setFacebookConnected(false);
      setFacebookPages([]);
      setSuccess('Successfully disconnected from Facebook');
    } catch (err) {
      console.error('Error disconnecting from Facebook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to disconnect from Facebook: ${errorMessage}`);
    }
  };

  const handleSavePage = async (page: any) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      await saveFacebookPageToProfile(page);
      setSuccess(`Successfully saved page: ${page.name} as default`);
    } catch (err) {
      console.error('Error saving Facebook page:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save Facebook page: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Social Media Connections</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4">
          {success}
        </div>
      )}
      
      <div className="space-y-6">
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">f</span>
              </div>
              <div>
                <h3 className="font-medium">Facebook</h3>
                <p className="text-sm text-gray-500">
                  {facebookConnected 
                    ? `Connected${facebookPages.length > 0 ? ` with ${facebookPages.length} page(s)` : ''}` 
                    : 'Not connected'}
                </p>
              </div>
            </div>
            
            <button
              onClick={facebookConnected ? handleDisconnectFacebook : handleConnectFacebook}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-sm ${
                facebookConnected 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? 'Loading...' : (facebookConnected ? 'Disconnect' : 'Connect')}
            </button>
          </div>
          
          {facebookConnected && facebookPages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Your Facebook Pages</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {facebookPages.map(page => (
                  <div 
                    key={page.id} 
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm">{page.name}</span>
                    <button
                      onClick={() => handleSavePage(page)}
                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                    >
                      Set as Default
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Instagram</h3>
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
            </div>
            
            <button
              onClick={() => alert('Instagram integration coming soon!')}
              className="px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-500 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                <span className="text-red-500 font-bold text-xl">G</span>
              </div>
              <div>
                <h3 className="font-medium">Google Business</h3>
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
            </div>
            
            <button
              onClick={() => alert('Google Business integration coming soon!')}
              className="px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-500 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaSettings;
