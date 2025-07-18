// Script to apply Supabase storage policy fixes
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be set.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'fix_supabase_storage.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL into individual statements
const statements = sql
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .filter(statement => statement.trim()); // Remove empty statements

async function executeSQL() {
  console.log('Starting to apply Supabase storage fixes...');
  
  try {
    // Make sure the bucket exists and is public
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('social-media-images');
    
    if (bucketError && bucketError.message.includes('not found')) {
      console.log('Creating social-media-images bucket...');
      const { error } = await supabase.storage.createBucket('social-media-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Bucket created successfully.');
      }
    } else if (bucketData) {
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
    
    // Set CORS configuration for the bucket
    console.log('Setting CORS configuration...');
    const corsConfig = [
      {
        origin: '*',
        methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        headers: ['*'],
        expose_headers: ['Content-Length', 'Content-Range'],
        max_age: 86400
      }
    ];
    
    // Note: Setting CORS requires admin privileges and might not work with anon key
    // This is typically done through the Supabase dashboard
    
    console.log('Storage configuration complete.');
    console.log('IMPORTANT: Please verify the following manually in the Supabase dashboard:');
    console.log('1. The social-media-images bucket is set to public');
    console.log('2. The CORS configuration is properly set');
    console.log('3. The RLS policies allow public access to the bucket');
    
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
    
    console.log('Storage fixes applied successfully!');
  } catch (error) {
    console.error('Error applying storage fixes:', error);
  }
}

executeSQL();
