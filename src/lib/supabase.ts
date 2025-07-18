import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // Don't set Content-Type globally as it interferes with file uploads
      // Let the browser set the appropriate Content-Type for multipart form data
      'Accept': '*/*', // Accept all content types
      'apikey': supabaseAnonKey,
      'Prefer': 'return=representation'
    },
  },
  db: {
    schema: 'public',
  },
});

// Helper function to make direct fetch requests to Supabase
export const fetchFromSupabase = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${supabaseUrl}${endpoint}`;
  
  // Get the current session token if available
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;
  
  const defaultHeaders = {
    'apikey': supabaseAnonKey,
    'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      console.error(`Supabase API error: ${response.status} ${response.statusText}`);
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
