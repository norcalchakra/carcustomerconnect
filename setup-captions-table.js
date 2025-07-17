// Script to set up the captions table in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCaptionsTable() {
  try {
    console.log('Setting up captions table in Supabase...');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'supabase_captions_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Captions table setup complete!');
    console.log(data);
  } catch (err) {
    console.error('Error setting up captions table:', err);
  }
}

setupCaptionsTable();
