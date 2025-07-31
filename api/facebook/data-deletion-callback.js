/**
 * Facebook Data Deletion Callback Handler
 * This is a server-side endpoint that handles Facebook's data deletion requests
 * Deploy this to your server (e.g., Hostinger with Node.js support or as a serverless function)
 */

const crypto = require('crypto');

// Environment variables (set these in your hosting environment)
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key for server operations
const APP_BASE_URL = process.env.VITE_APP_URL;

// Supabase client for server-side operations
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse and verify Facebook signed request
 */
function parseSignedRequest(signedRequest, appSecret) {
  try {
    const [encodedSig, payload] = signedRequest.split('.', 2);
    
    // Decode the signature and payload
    const sig = base64UrlDecode(encodedSig);
    const data = JSON.parse(base64UrlDecode(payload));
    
    // Verify the signature using HMAC-SHA256
    const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();
    
    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      console.error('Invalid Facebook signed request signature');
      return null;
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (data.expires && data.expires < now) {
      console.error('Facebook signed request has expired');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing Facebook signed request:', error);
    return null;
  }
}

/**
 * Base64 URL decode helper
 */
function base64UrlDecode(input) {
  // Replace URL-safe characters
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  return Buffer.from(padded, 'base64');
}

/**
 * Generate a secure confirmation code
 */
function generateConfirmationCode() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Handle Facebook data deletion callback
 */
async function handleFacebookDataDeletion(signedRequest) {
  // Parse and verify the signed request
  const requestData = parseSignedRequest(signedRequest, FACEBOOK_APP_SECRET);
  if (!requestData) {
    return null;
  }
  
  const { user_id } = requestData;
  const confirmationCode = generateConfirmationCode();
  const statusUrl = `${APP_BASE_URL}/data-deletion-status?id=${confirmationCode}`;
  
  try {
    // Log the deletion request
    await supabase
      .from('data_deletion_requests')
      .insert({
        facebook_user_id: user_id,
        confirmation_code: confirmationCode,
        status: 'PENDING',
        status_message: 'Facebook data deletion request received',
        requested_at: new Date().toISOString(),
        status_url: statusUrl
      });
    
    // Start the deletion process asynchronously
    setImmediate(() => {
      initiateDeletionProcess(user_id, confirmationCode).catch(error => {
        console.error('Error in deletion process:', error);
      });
    });
    
    return {
      url: statusUrl,
      confirmation_code: confirmationCode
    };
  } catch (error) {
    console.error('Error handling Facebook data deletion:', error);
    return null;
  }
}

/**
 * Initiate the actual data deletion process
 */
async function initiateDeletionProcess(facebookUserId, confirmationCode) {
  try {
    // Update status to IN_PROGRESS
    await updateDeletionStatus(confirmationCode, 'IN_PROGRESS', 'Starting data deletion process');
    
    // Find user account associated with Facebook ID
    const { data: userAccount } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .eq('facebook_user_id', facebookUserId)
      .single();
    
    if (userAccount) {
      // Delete user's data
      await deleteUserData(userAccount.user_id);
    }
    
    // Delete Facebook-specific data
    await deleteFacebookData(facebookUserId);
    
    // Update status to COMPLETED
    await updateDeletionStatus(confirmationCode, 'COMPLETED', 'All data successfully deleted');
    
  } catch (error) {
    console.error('Error in deletion process:', error);
    await updateDeletionStatus(
      confirmationCode, 
      'ERROR', 
      `Deletion failed: ${error.message}`
    );
  }
}

/**
 * Delete all user data
 */
async function deleteUserData(userId) {
  const tables = [
    'vehicles',
    'social_posts',
    'vehicle_events',
    'brand_voice_settings',
    'dealership_profiles',
    'lifecycle_templates',
    'competitive_differentiators',
    'content_governance_rules',
    'example_captions',
    'technical_integrations',
    'customization_parameters'
  ];
  
  for (const table of tables) {
    try {
      await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
    }
  }
  
  // Delete user profile last
  await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId);
}

/**
 * Delete Facebook-specific data
 */
async function deleteFacebookData(facebookUserId) {
  // Delete Facebook access tokens
  await supabase
    .from('facebook_tokens')
    .delete()
    .eq('facebook_user_id', facebookUserId);
  
  // Delete Facebook page connections
  await supabase
    .from('facebook_pages')
    .delete()
    .eq('facebook_user_id', facebookUserId);
  
  // Delete cached Facebook data
  await supabase
    .from('facebook_user_cache')
    .delete()
    .eq('facebook_user_id', facebookUserId);
}

/**
 * Update deletion request status
 */
async function updateDeletionStatus(confirmationCode, status, message) {
  await supabase
    .from('data_deletion_requests')
    .update({
      status,
      status_message: message,
      updated_at: new Date().toISOString()
    })
    .eq('confirmation_code', confirmationCode);
}

/**
 * Main handler function (for serverless environments like Vercel, Netlify Functions, etc.)
 */
async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { signed_request } = JSON.parse(event.body);
    
    if (!signed_request) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing signed_request parameter' })
      };
    }

    const result = await handleFacebookDataDeletion(signed_request);
    
    if (!result) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid signed request' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

/**
 * Express.js handler (for traditional server deployments)
 */
function expressHandler(req, res) {
  // Handle CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { signed_request } = req.body;
  
  if (!signed_request) {
    return res.status(400).json({ error: 'Missing signed_request parameter' });
  }

  handleFacebookDataDeletion(signed_request)
    .then(result => {
      if (!result) {
        return res.status(400).json({ error: 'Invalid signed request' });
      }
      res.json(result);
    })
    .catch(error => {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
}

// Export both handlers for different deployment scenarios
module.exports = {
  handler, // For serverless (Vercel, Netlify Functions, AWS Lambda)
  expressHandler, // For Express.js servers
  handleFacebookDataDeletion // For direct usage
};
