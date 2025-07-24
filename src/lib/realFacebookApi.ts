/**
 * Real Facebook API implementation using user's access token
 * This replaces the mock implementation for actual Facebook posting
 */

// Configuration from environment variables
const FACEBOOK_CONFIG = {
  accessToken: import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN,
  userId: import.meta.env.VITE_FACEBOOK_USER_ID,
  userName: import.meta.env.VITE_FACEBOOK_USER_NAME,
  apiVersion: 'v18.0'
};

// Types
interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

interface FacebookPostResponse {
  id: string;
}

// Helper function to make Facebook API calls
const callFacebookAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const baseUrl = `https://graph.facebook.com/${FACEBOOK_CONFIG.apiVersion}`;
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Facebook API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Check if real Facebook credentials are available
export const isRealFacebookConfigured = (): boolean => {
  return !!(FACEBOOK_CONFIG.accessToken && FACEBOOK_CONFIG.userId);
};

// Get user's Facebook pages
export const getRealUserPages = async (): Promise<FacebookPageInfo[]> => {
  if (!isRealFacebookConfigured()) {
    throw new Error('Facebook credentials not configured');
  }

  try {
    console.log('Fetching Facebook pages for user:', FACEBOOK_CONFIG.userName);
    
    const response = await callFacebookAPI(
      `/me/accounts?access_token=${FACEBOOK_CONFIG.accessToken}&fields=id,name,access_token,category`
    );

    console.log('Facebook pages response:', response);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    throw error;
  }
};

// Post to a Facebook page using real API
export const postToRealFacebookPage = async (
  pageId: string,
  pageAccessToken: string,
  message: string,
  imageUrls?: string[]
): Promise<string> => {
  if (!isRealFacebookConfigured()) {
    throw new Error('Facebook credentials not configured');
  }

  try {
    console.log('Posting to Facebook page:', pageId);
    console.log('Message:', message);
    console.log('Images:', imageUrls);

    let postData: any = {
      message: message,
      access_token: pageAccessToken
    };

    // If we have images, we need to handle them differently
    if (imageUrls && imageUrls.length > 0) {
      // For now, we'll post the first image with the message
      // Facebook API requires images to be uploaded first or referenced by URL
      const imageUrl = imageUrls[0];
      
      // If it's a data URL, we need to upload it first
      if (imageUrl.startsWith('data:')) {
        console.log('Uploading image data to Facebook...');
        // For data URLs, we would need to upload to Facebook first
        // This is more complex and requires additional API calls
        // For now, we'll post without the image and log a warning
        console.warn('Data URL images not yet supported for real Facebook posting');
      } else if (imageUrl.startsWith('http')) {
        // External URL - Facebook can fetch this directly
        postData.link = imageUrl;
      }
    }

    const response = await callFacebookAPI(
      `/${pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      }
    );

    console.log('Facebook post created successfully:', response);
    return response.id;
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    throw error;
  }
};

// Get basic user info
export const getRealUserInfo = async () => {
  if (!isRealFacebookConfigured()) {
    throw new Error('Facebook credentials not configured');
  }

  try {
    const response = await callFacebookAPI(
      `/me?access_token=${FACEBOOK_CONFIG.accessToken}&fields=id,name`
    );
    
    console.log('Facebook user info:', response);
    return response;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};

// Test the Facebook connection
export const testFacebookConnection = async (): Promise<boolean> => {
  try {
    await getRealUserInfo();
    return true;
  } catch (error) {
    console.error('Facebook connection test failed:', error);
    return false;
  }
};

export default {
  isRealFacebookConfigured,
  getRealUserPages,
  postToRealFacebookPage,
  getRealUserInfo,
  testFacebookConnection
};
