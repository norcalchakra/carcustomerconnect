// Simple script to apply the user_social_accounts RLS fix to Supabase
// Run this with: node apply-rls-fix-simple.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration.');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  console.error('\nTo get your service role key:');
  console.error('1. Go to Supabase Dashboard → Settings → API');
  console.error('2. Copy the "service_role" key (not the "anon" key)');
  console.error('3. Add it to your .env file as: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

async function applySocialAccountsFix() {
  try {
    console.log('🔧 Reading SQL fix file...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix_user_social_accounts_rls.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📡 Applying SQL fix to Supabase...');
    
    // Use fetch to call Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });
    
    if (response.ok) {
      console.log('✅ SQL fix applied successfully!');
      console.log('The user_social_accounts table and RLS policies have been created/updated.');
    } else {
      const error = await response.text();
      console.error('❌ Failed to apply SQL fix:', error);
      console.error('\n📝 Manual application instructions:');
      console.error('1. Go to Supabase Dashboard → SQL Editor');
      console.error('2. Copy the contents of fix_user_social_accounts_rls.sql');
      console.error('3. Paste and run the SQL script');
    }
    
  } catch (error) {
    console.error('❌ Error applying SQL fix:', error.message);
    console.error('\n📝 Manual application instructions:');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error('2. Copy the contents of fix_user_social_accounts_rls.sql');
    console.error('3. Paste and run the SQL script');
  }
}

// Run the fix
applySocialAccountsFix();
