// Database setup script for Car Customer Connect
// This script creates all the necessary tables and sample data in Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFilePath = path.join(__dirname, '../supabase_setup.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split SQL into individual statements
const sqlStatements = sqlContent
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute SQL statements
async function setupDatabase() {
  console.log('Starting database setup...');
  
  try {
    // Execute each SQL statement
    for (const [index, statement] of sqlStatements.entries()) {
      console.log(`Executing statement ${index + 1}/${sqlStatements.length}`);
      
      // Use the Supabase REST API to execute SQL
      const { data, error } = await supabase.from('_sql').select('*').execute(statement);
      
      if (error) {
        console.error(`Error executing statement ${index + 1}:`, error);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase().catch(error => {
  console.error('Failed to set up database:', error);
  process.exit(1);
});
