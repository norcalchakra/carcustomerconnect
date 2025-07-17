// Database setup script for Car Customer Connect
// This script creates all the necessary tables and sample data in Supabase

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the SQL file
const sqlFilePath = path.join(__dirname, '../supabase_setup.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  console.error('For this script to work properly, you need to add your service role key to the .env file:');
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Starting database setup...');
  
  try {
    // For service role key, we can use the rpc method to execute SQL
    // This won't work with the anon key due to security restrictions
    const { data, error } = await supabase.rpc('pg_execute', { query_text: sqlContent });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Database setup completed successfully!');
    console.log('Result:', data);
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Check if we're using the service role key
if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('\n⚠️ WARNING: You are not using a service role key. This script may not have sufficient permissions to create tables.\n');
  console.warn('To properly set up your database, you should:');
  console.warn('1. Get your service role key from the Supabase dashboard');
  console.warn('2. Add it to your .env file as VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.warn('3. Run this script again\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Do you want to continue anyway? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      setupDatabase();
    } else {
      console.log('Setup canceled.');
    }
    readline.close();
  });
} else {
  setupDatabase();
}
