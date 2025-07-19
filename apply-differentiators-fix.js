// Script to apply the differentiators table fixes to Supabase
// Usage: node apply-differentiators-fix.js

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Make sure you have VITE_SUPABASE_URL and either VITE_SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY set.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDifferentiatorsTableFix() {
  try {
    console.log('Reading SQL script...');
    const sqlScript = fs.readFileSync('./fix_differentiators_table_safe.sql', 'utf8');
    
    console.log('Applying SQL fixes to differentiators table...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Error applying SQL fixes:', error);
      return;
    }
    
    console.log('SQL fixes applied successfully!');
    console.log('Result:', data);
    
    // Verify the table structure
    console.log('\nVerifying table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('competitive_differentiators')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error verifying table structure:', tableError);
      return;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('Table structure verified. Sample record:');
      console.log(JSON.stringify(tableInfo[0], null, 2));
    } else {
      console.log('Table exists but no records found.');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Execute the function
applyDifferentiatorsTableFix();
