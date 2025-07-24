/**
 * Hybrid Facebook API that automatically chooses between real and mock implementations
 * Uses real Facebook API when credentials are available, falls back to mock for testing
 */

import { 
  isRealFacebookConfigured, 
  getRealUserPages, 
  postToRealFacebookPage, 
  getRealUserInfo,
  testFacebookConnection 
} from './realFacebookApi';

import { 
  mockGetUserPages, 
  mockPostToFacebookPage, 
  mockIsFacebookConnected,
  mockInitFacebookSDK,
  mockLoginWithFacebook,
  mockLogoutFromFacebook,
  mockSaveFacebookPageToProfile,
  mockGetSavedFacebookPages,
  mockUpdateCaptionWithFacebookPost
} from './mockFacebookApi';

// Types
interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

// Determine if we should use real or mock API
const shouldUseRealAPI = (): boolean => {
  return isRealFacebookConfigured();
};

// Initialize Facebook SDK (hybrid approach)
export const initFacebookSDK = async (): Promise<void> => {
  if (shouldUseRealAPI()) {
    console.log('Using real Facebook API - no SDK initialization needed');
    return Promise.resolve();
  } else {
    console.log('Using mock Facebook API');
    return mockInitFacebookSDK();
  }
};

// Check if Facebook is connected
export const isFacebookConnected = (): boolean => {
  if (shouldUseRealAPI()) {
    return isRealFacebookConfigured();
  } else {
    return mockIsFacebookConnected();
  }
};

// Login with Facebook
export const loginWithFacebook = async (): Promise<string> => {
  if (shouldUseRealAPI()) {
    // For real API, we already have the access token
    console.log('Using pre-configured Facebook access token');
    return import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
  } else {
    return mockLoginWithFacebook();
  }
};

// Get user's Facebook pages
export const getUserPages = async (accessToken?: string): Promise<FacebookPageInfo[]> => {
  if (shouldUseRealAPI()) {
    console.log('Fetching real Facebook pages');
    return getRealUserPages();
  } else {
    console.log('Using mock Facebook pages');
    return mockGetUserPages(accessToken || 'mock_token');
  }
};

// Post to Facebook page
export const postToFacebookPage = async (
  pageId: string,
  pageAccessToken: string,
  message: string,
  imageUrls?: string[]
): Promise<string> => {
  if (shouldUseRealAPI()) {
    console.log('Posting to real Facebook page');
    return postToRealFacebookPage(pageId, pageAccessToken, message, imageUrls);
  } else {
    console.log('Using mock Facebook posting');
    return mockPostToFacebookPage(pageId, pageAccessToken, message, imageUrls);
  }
};

// Logout from Facebook
export const logoutFromFacebook = (): void => {
  if (shouldUseRealAPI()) {
    console.log('Real Facebook logout - clearing local state');
    // For real API, we don't need to do anything special
  } else {
    mockLogoutFromFacebook();
  }
};

// Save Facebook page to profile
export const saveFacebookPageToProfile = async (pageInfo: FacebookPageInfo): Promise<void> => {
  // This function works the same for both real and mock
  return mockSaveFacebookPageToProfile(pageInfo);
};

// Get saved Facebook pages
export const getSavedFacebookPages = async (): Promise<FacebookPageInfo[]> => {
  // This function works the same for both real and mock
  return mockGetSavedFacebookPages();
};

// Update caption with Facebook post
export const updateCaptionWithFacebookPost = async (
  captionId: number,
  postId: string
): Promise<void> => {
  // This function works the same for both real and mock
  return mockUpdateCaptionWithFacebookPost(captionId, postId);
};

// Test Facebook connection
export const testConnection = async (): Promise<boolean> => {
  if (shouldUseRealAPI()) {
    return testFacebookConnection();
  } else {
    return true; // Mock is always "connected"
  }
};

// Get current API mode for debugging
export const getCurrentAPIMode = (): 'real' | 'mock' => {
  return shouldUseRealAPI() ? 'real' : 'mock';
};

// Export all functions with consistent naming
export default {
  initFacebookSDK,
  isFacebookConnected,
  loginWithFacebook,
  getUserPages,
  postToFacebookPage,
  logoutFromFacebook,
  saveFacebookPageToProfile,
  getSavedFacebookPages,
  updateCaptionWithFacebookPost,
  testConnection,
  getCurrentAPIMode
};
