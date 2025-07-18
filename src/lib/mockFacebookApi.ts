/**
 * Mock Facebook API for testing without a real Facebook App ID
 * This simulates the Facebook login flow and API responses
 */

// Mock Facebook API configuration
const MOCK_CONFIG = {
  delay: 1000, // Simulate network delay in ms
};

// Mock pages data
const MOCK_PAGES = [
  {
    id: '987654321',
    name: 'Test Dealership Page',
    access_token: 'mock_page_access_token_1',
    category: 'Automotive',
  },
  {
    id: '987654322',
    name: 'Another Test Page',
    access_token: 'mock_page_access_token_2',
    category: 'Business',
  },
];

// Helper to simulate async API calls
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), MOCK_CONFIG.delay);
  });
};

// Mock initialization of Facebook SDK
export const mockInitFacebookSDK = async (): Promise<void> => {
  console.log('Mock Facebook SDK initialized');
  localStorage.setItem('mock_fb_sdk_initialized', 'true');
  return Promise.resolve();
};

// Check if Facebook is connected
export const mockIsFacebookConnected = (): boolean => {
  const hasToken = localStorage.getItem('mock_fb_access_token') !== null;
  console.log('Mock Facebook connected status:', hasToken);
  return hasToken;
};

// Mock login with Facebook
export const mockLoginWithFacebook = async (): Promise<string> => {
  console.log('Mock Facebook login initiated');
  const token = 'mock_user_access_token_' + Date.now();
  localStorage.setItem('mock_fb_access_token', token);
  return simulateApiCall(token);
};

// Mock getting user pages
export const mockGetUserPages = (accessToken: string): Promise<any[]> => {
  console.log('Mock getting Facebook pages with token:', accessToken);
  return simulateApiCall(MOCK_PAGES);
};

// Mock posting to a Facebook page
export const mockPostToFacebookPage = (
  pageId: string, 
  pageAccessToken: string, 
  message: string, 
  imageUrls?: string[]
): Promise<string> => {
  console.log('Mock posting to Facebook page:', pageId);
  console.log('Message:', message);
  
  // Handle real image URLs from Supabase storage
  if (imageUrls && imageUrls.length > 0) {
    console.log(`Posting ${imageUrls.length} images to Facebook:`);
    imageUrls.forEach((url, index) => {
      console.log(`Image ${index + 1}:`, url);
      // In a real implementation, we would upload these images to Facebook
      // or use the URL directly if Facebook supports external URLs
    });
  }
  
  // In a real implementation, we would use the pageAccessToken to authenticate
  // Log that we're using the token (to avoid unused parameter warning)
  console.log(`Using page access token: ${pageAccessToken.substring(0, 5)}...`); 
  
  // Generate a mock post ID that includes the page ID for traceability
  const mockPostId = `mock_fb_${pageId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  console.log('Created mock post with ID:', mockPostId);
  
  return simulateApiCall(mockPostId);
};

// Mock updating caption with Facebook post
export const mockUpdateCaptionWithFacebookPost = async (
  captionId: number,
  postId: string
): Promise<void> => {
  console.log('Mock updating caption', captionId, 'with post ID', postId);
  return simulateApiCall(undefined);
};

// Export as alias for compatibility with SocialPostForm
export const updateCaptionWithFacebookPost = mockUpdateCaptionWithFacebookPost;

// Mock Facebook logout
export const mockLogoutFromFacebook = (): void => {
  localStorage.removeItem('mock_fb_access_token');
  console.log('Mock Facebook logout');
};

// Mock saving a Facebook page to user profile
export const mockSaveFacebookPageToProfile = (page: any): Promise<void> => {
  console.log('Mock saving Facebook page to profile:', page);
  return simulateApiCall(undefined);
};

// Mock getting saved Facebook pages
export const mockGetSavedFacebookPages = (): Promise<any[]> => {
  console.log('Mock getting saved Facebook pages');
  return simulateApiCall(MOCK_PAGES);
};
