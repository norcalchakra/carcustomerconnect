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

// Helper function to convert data URL to blob
const dataURLToBlob = async (dataURL: string): Promise<Blob> => {
  const response = await fetch(dataURL);
  return response.blob();
};

// Helper function to upload photo to Facebook using FormData
const uploadPhotoToFacebook = async (
  pageId: string, 
  pageAccessToken: string, 
  message: string, 
  imageBlob: Blob
): Promise<string> => {
  const formData = new FormData();
  formData.append('source', imageBlob);
  formData.append('caption', message);
  formData.append('access_token', pageAccessToken);

  const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Facebook photo upload error:', errorData);
    throw new Error(`Facebook photo upload failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  console.log('Facebook photo upload successful:', result);
  return result.id || result.post_id;
};

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

    // If we have images, upload them properly to Facebook
    if (imageUrls && imageUrls.length > 0) {
      console.log('Processing images for Facebook upload...');
      
      // For single image, we can post directly with the photo
      if (imageUrls.length === 1) {
        const imageUrl = imageUrls[0];
        
        if (imageUrl.startsWith('data:')) {
          // Convert data URL to blob and upload
          console.log('Converting data URL to blob for Facebook upload...');
          const blob = await dataURLToBlob(imageUrl);
          return await uploadPhotoToFacebook(pageId, pageAccessToken, message, blob);
        } else if (imageUrl.startsWith('http')) {
          // Use external URL directly
          postData.url = imageUrl;
          delete postData.message; // When posting photo, message goes in different field
          postData.caption = message;
          
          // Post to photos endpoint instead of feed
          const response = await callFacebookAPI(
            `/${pageId}/photos`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData)
            }
          );
          
          console.log('Facebook photo post response:', response);
          return response.id || response.post_id;
        }
      } else {
        // Multiple images - upload each photo first, then create post with attached_media
        console.log(`Multiple images detected (${imageUrls.length}), uploading all images...`);
        
        const attachedMedia = [];
        
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          console.log(`Processing image ${i + 1}/${imageUrls.length}: ${imageUrl}`);
          
          if (imageUrl.startsWith('http')) {
            try {
              // Upload photo without publishing (published=false)
              const photoData = {
                url: imageUrl,
                published: false,
                access_token: pageAccessToken
              };
              
              const photoResponse = await callFacebookAPI(
                `/${pageId}/photos`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(photoData)
                }
              );
              
              if (photoResponse.id) {
                attachedMedia.push({ media_fbid: photoResponse.id });
                console.log(`Successfully uploaded image ${i + 1}, photo ID: ${photoResponse.id}`);
              }
            } catch (error) {
              console.error(`Failed to upload image ${i + 1}:`, error);
            }
          }
        }
        
        if (attachedMedia.length > 0) {
          // Create post with all attached media
          const multiPostData = {
            message: message,
            attached_media: attachedMedia,
            access_token: pageAccessToken
          };
          
          console.log(`Creating Facebook post with ${attachedMedia.length} images...`);
          const response = await callFacebookAPI(
            `/${pageId}/feed`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(multiPostData)
            }
          );
          
          console.log('Multi-image Facebook post created successfully:', response);
          return response.id;
        } else {
          console.warn('No images could be uploaded, falling back to text-only post');
        }
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
