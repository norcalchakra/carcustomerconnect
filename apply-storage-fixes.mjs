// Script to apply Supabase storage policy fixes
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be set.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeStorageFixes() {
  console.log('Starting to apply Supabase storage fixes...');
  
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const socialMediaBucket = buckets.find(bucket => bucket.name === 'social-media-images');
    
    if (!socialMediaBucket) {
      console.log('Creating social-media-images bucket...');
      const { error } = await supabase.storage.createBucket('social-media-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      console.log('Bucket created successfully.');
    } else {
      console.log('Bucket already exists. Updating to ensure it is public...');
      const { error } = await supabase.storage.updateBucket('social-media-images', {
        public: true
      });
      
      if (error) {
        console.error('Error updating bucket:', error);
      } else {
        console.log('Bucket updated successfully.');
      }
    }
    
    // List some recent objects in the bucket to verify access
    const { data: objects, error: objectsError } = await supabase.storage
      .from('social-media-images')
      .list();
    
    if (objectsError) {
      console.error('Error listing objects:', objectsError);
    } else {
      console.log('Recent objects in bucket:');
      console.log(objects.slice(0, 5));
    }
    
    // Test uploading a small test file to verify permissions
    const testContent = 'This is a test file to verify storage permissions';
    const testBuffer = new TextEncoder().encode(testContent);
    const testFile = new File([testBuffer], 'test-permissions.txt', { type: 'text/plain' });
    
    console.log('Attempting to upload test file to verify permissions...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload('test-permissions.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
    } else {
      console.log('Test file uploaded successfully:', uploadData);
      
      // Get public URL for the test file
      const { data: publicUrlData } = supabase.storage
        .from('social-media-images')
        .getPublicUrl('test-permissions.txt');
      
      console.log('Public URL for test file:', publicUrlData.publicUrl);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('social-media-images')
        .remove(['test-permissions.txt']);
      
      if (deleteError) {
        console.error('Error deleting test file:', deleteError);
      } else {
        console.log('Test file deleted successfully.');
      }
    }
    
    console.log('Storage fixes applied successfully!');
    console.log('IMPORTANT: Please verify the following manually in the Supabase dashboard:');
    console.log('1. The social-media-images bucket is set to public');
    console.log('2. The CORS configuration is properly set');
    console.log('3. The RLS policies allow public access to the bucket');
  } catch (error) {
    console.error('Error applying storage fixes:', error);
  }
}

executeStorageFixes();
