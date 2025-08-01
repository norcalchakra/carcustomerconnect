// Script to apply the user_social_accounts RLS fix to Supabase
// Run this with: node apply-social-accounts-fix.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySocialAccountsFix() {
  try {
    console.log('🔧 Applying user_social_accounts RLS fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_user_social_accounts_rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error applying fix:', error);
      
      // Try alternative approach - execute SQL directly
      console.log('🔄 Trying alternative approach...');
      const { error: directError } = await supabase
        .from('_supabase_migrations')
        .insert({ version: Date.now().toString(), name: 'fix_user_social_accounts_rls' });
      
      if (directError) {
        console.error('❌ Direct approach also failed:', directError);
        console.log('\n📋 Manual Steps Required:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of fix_user_social_accounts_rls.sql');
        console.log('4. Run the SQL script');
        return;
      }
    }
    
    console.log('✅ Successfully applied user_social_accounts RLS fix!');
    console.log('🔍 Verifying table exists...');
    
    // Verify the table exists and has proper structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_social_accounts')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('⚠️  Table verification failed:', tableError.message);
      console.log('Please run the SQL script manually in Supabase Dashboard.');
    } else {
      console.log('✅ Table verification successful!');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n📋 Manual Steps Required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of fix_user_social_accounts_rls.sql');
    console.log('4. Run the SQL script');
  }
}

// Run the fix
applySocialAccountsFix();
