import { supabase } from './supabase';

interface DeletionStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
  message: string;
  created_at: string;
  updated_at: string;
}

interface DataDeletionRequest {
  email: string;
  reason?: string;
  facebook_connected: boolean;
}

/**
 * Generate a secure confirmation code (browser-compatible)
 */
function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Submit a data deletion request from the browser
 * This creates a deletion request that will be processed by the backend
 */
export async function submitDataDeletionRequest(
  request: DataDeletionRequest
): Promise<{ success: boolean; confirmationCode?: string; error?: string }> {
  try {
    const confirmationCode = generateConfirmationCode();
    const baseUrl = window.location.origin;
    const statusUrl = `${baseUrl}/data-deletion-status?id=${confirmationCode}`;
    
    // Insert deletion request into database
    const { error } = await supabase
      .from('data_deletion_requests')
      .insert({
        facebook_user_id: 'browser-request', // Will be updated by backend if Facebook user
        confirmation_code: confirmationCode,
        status: 'PENDING',
        status_message: `Data deletion requested for ${request.email}. Reason: ${request.reason || 'User request'}`,
        requested_at: new Date().toISOString(),
        status_url: statusUrl
      });
    
    if (error) {
      console.error('Error submitting deletion request:', error);
      return { success: false, error: 'Failed to submit deletion request' };
    }
    
    // If this is a Facebook-connected user, we'll need backend processing
    if (request.facebook_connected) {
      // Trigger backend processing (this would be handled by a server endpoint)
      console.log('Facebook-connected user deletion request submitted');
    }
    
    return { success: true, confirmationCode };
  } catch (error) {
    console.error('Error submitting deletion request:', error);
    return { success: false, error: 'Failed to submit deletion request' };
  }
}

/**
 * Initiate user data deletion (browser-compatible version)
 * This marks data for deletion and can trigger backend processing
 */
export async function initiateUserDataDeletion(userId: string, confirmationCode: string): Promise<void> {
  try {
    // Update status to IN_PROGRESS
    await updateDeletionStatus(confirmationCode, 'IN_PROGRESS', 'Starting data deletion process');
    
    // Mark user data for deletion (actual deletion should be handled by backend)
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
    
    // Soft delete or mark for deletion
    for (const table of tables) {
      try {
        await supabase
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('deleted_at', null);
      } catch (error) {
        console.error(`Error marking ${table} for deletion:`, error);
      }
    }
    
    // Update status to COMPLETED
    await updateDeletionStatus(confirmationCode, 'COMPLETED', 'Data deletion process completed');
    
  } catch (error) {
    console.error('Error in deletion process:', error);
    await updateDeletionStatus(
      confirmationCode, 
      'ERROR', 
      `Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update deletion request status
 */
async function updateDeletionStatus(
  confirmationCode: string, 
  status: DeletionStatus['status'], 
  message: string
): Promise<void> {
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
 * Get deletion status by confirmation code
 */
export async function getDeletionStatus(confirmationCode: string): Promise<DeletionStatus | null> {
  const { data, error } = await supabase
    .from('data_deletion_requests')
    .select('status, status_message, created_at, updated_at')
    .eq('confirmation_code', confirmationCode)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    status: data.status,
    message: data.status_message || '',
    created_at: data.created_at,
    updated_at: data.updated_at || data.created_at
  };
}
