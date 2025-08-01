import { supabase } from './supabase';

// Types
interface FacebookAuthConfig {
  appId: string;
  version: string;
}

interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
}

// Configuration
const FB_CONFIG: FacebookAuthConfig = {
  appId: import.meta.env.VITE_FACEBOOK_APP_ID || '1234567890123456', // Fallback to test ID
  version: 'v18.0', // Using a recent Facebook Graph API version
};

// Check if we're running on HTTPS (required by Facebook)
const isHTTPS = (): boolean => {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};

// Initialize Facebook SDK
export const initFacebookSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check HTTPS requirement
    if (!isHTTPS() && window.location.hostname !== 'localhost') {
      reject(new Error('Facebook API requires HTTPS. Please use https:// or run on localhost.'));
      return;
    }

    // Check if FB SDK is already loaded
    if ((window as any).FB) {
      resolve();
      return;
    }

    // Load the Facebook SDK asynchronously
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId: FB_CONFIG.appId,
        cookie: true,
        xfbml: true,
        version: FB_CONFIG.version
      });
      
      resolve();
    };

    // Load the SDK
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });
};

// Login with Facebook and get access token
export const loginWithFacebook = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check HTTPS requirement before attempting login
    if (!isHTTPS() && window.location.hostname !== 'localhost') {
      reject(new Error('Facebook login requires HTTPS. Please use https:// or run the development server with HTTPS enabled.'));
      return;
    }
    (window as any).FB.login((response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        // Store the token in localStorage for persistence
        localStorage.setItem('fb_access_token', accessToken);
        resolve(accessToken);
      } else {
        reject(new Error('Facebook login failed or was cancelled'));
      }
    }, { scope: 'pages_manage_posts,pages_read_engagement' });
  });
};

// Get user's Facebook pages
export const getUserPages = async (accessToken: string): Promise<FacebookPageInfo[]> => {
  return new Promise((resolve, reject) => {
    (window as any).FB.api('/me/accounts', { access_token: accessToken }, (response: any) => {
      if (response && !response.error) {
        const pages = response.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token
        }));
        resolve(pages);
      } else {
        reject(new Error(response.error?.message || 'Failed to fetch pages'));
      }
    });
  });
};

// Post to a Facebook page
export const postToFacebookPage = async (
  pageId: string, 
  pageAccessToken: string, 
  message: string,
  imageUrls?: string[]
): Promise<string> => {
  // If we have images, create a photo post
  if (imageUrls && imageUrls.length > 0) {
    return postPhotoToFacebookPage(pageId, pageAccessToken, message, imageUrls[0]);
  }
  
  // Otherwise create a text-only post
  return new Promise((resolve, reject) => {
    (window as any).FB.api(
      `/${pageId}/feed`,
      'POST',
      {
        message: message,
        access_token: pageAccessToken
      },
      (response: any) => {
        if (response && !response.error) {
          resolve(response.id);
        } else {
          reject(new Error(response.error?.message || 'Failed to post to Facebook'));
        }
      }
    );
  });
};

// Post a photo to a Facebook page
export const postPhotoToFacebookPage = async (
  pageId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    (window as any).FB.api(
      `/${pageId}/photos`,
      'POST',
      {
        url: imageUrl,
        caption: caption,
        access_token: pageAccessToken
      },
      (response: any) => {
        if (response && !response.error) {
          resolve(response.id);
        } else {
          reject(new Error(response.error?.message || 'Failed to post photo to Facebook'));
        }
      }
    );
  });
};

// Save Facebook page info to user's profile in Supabase
export const saveFacebookPageToProfile = async (pageInfo: FacebookPageInfo): Promise<void> => {
  const { error } = await supabase
    .from('user_social_accounts')
    .upsert({
      platform: 'facebook',
      platform_id: pageInfo.id,
      platform_name: pageInfo.name,
      access_token: pageInfo.access_token,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    throw new Error(`Failed to save Facebook page: ${error.message}`);
  }
};

// Get saved Facebook pages from user's profile
export const getSavedFacebookPages = async (): Promise<FacebookPageInfo[]> => {
  const { data, error } = await supabase
    .from('user_social_accounts')
    .select('*')
    .eq('platform', 'facebook');
  
  if (error) {
    throw new Error(`Failed to get Facebook pages: ${error.message}`);
  }
  
  return data.map((account: any) => ({
    id: account.platform_id,
    name: account.platform_name,
    access_token: account.access_token
  }));
};

// Update caption record with Facebook post info
export const updateCaptionWithFacebookPost = async (
  captionId: number, 
  postId: string
): Promise<void> => {
  const { error } = await supabase
    .from('captions')
    .update({
      posted_to_facebook: true,
      facebook_post_id: postId,
      facebook_posted_at: new Date().toISOString()
    })
    .eq('id', captionId);
  
  if (error) {
    throw new Error(`Failed to update caption with Facebook post info: ${error.message}`);
  }
};

// Check if Facebook SDK is loaded and user is logged in
export const isFacebookConnected = (): boolean => {
  return !!(window as any).FB && !!localStorage.getItem('fb_access_token');
};

// Logout from Facebook
export const logoutFromFacebook = (): void => {
  if ((window as any).FB) {
    (window as any).FB.logout();
  }
  localStorage.removeItem('fb_access_token');
};
