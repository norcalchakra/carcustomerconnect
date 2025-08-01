# Facebook API Integration Fix Guide

## Issues Identified ✅

1. **HTTPS Requirement**: Facebook API requires HTTPS for login and API calls (enforced since 2018)
2. **Supabase RLS Policy**: Row-level security policy violation on `user_social_accounts` table

## Solutions Implemented ✅

### 1. HTTPS Development Server Configuration

**Files Modified:**
- `vite.config.ts` - Added HTTPS configuration
- `package.json` - Added `dev:https` script
- `start-https-dev.js` - HTTPS development server script

**Usage:**
```bash
# Start development server with HTTPS
npm run dev:https
```

### 2. Supabase RLS Policy Fix

**Files Created:**
- `fix_user_social_accounts_rls.sql` - SQL script to fix RLS policies
- `apply-social-accounts-fix.js` - JavaScript utility to apply the fix

**Manual Steps:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_user_social_accounts_rls.sql`
4. Run the SQL script

### 3. Enhanced Facebook API Error Handling

**Files Modified:**
- `src/lib/facebookApi.ts` - Added HTTPS checks and better error messages

**Improvements:**
- HTTPS requirement validation
- Clear error messages for protocol issues
- Better debugging information

## Testing Steps 🧪

### Step 1: Apply Supabase Fix
```bash
# Option 1: Use the JavaScript utility (requires SUPABASE_SERVICE_ROLE_KEY in .env)
node apply-social-accounts-fix.js

# Option 2: Manual SQL execution in Supabase Dashboard
# Copy contents of fix_user_social_accounts_rls.sql and run in SQL Editor
```

### Step 2: Start HTTPS Development Server
```bash
npm run dev:https
```

### Step 3: Test Facebook Integration
1. Navigate to `https://localhost:3000`
2. Accept the self-signed certificate warning
3. Try Facebook login functionality
4. Test posting to Facebook pages

## Environment Variables Required 🔧

Add to your `.env` file:
```env
# Required for Facebook API
VITE_FACEBOOK_APP_ID=your_facebook_app_id

# Optional: For automated Supabase fix application
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting 🔍

### Certificate Warnings
- Browser will show security warnings for self-signed certificates
- Click "Advanced" → "Proceed to localhost (unsafe)" to continue
- This is normal for development with self-signed certificates

### Facebook App Configuration
Ensure your Facebook App has:
- Valid OAuth redirect URIs including `https://localhost:3000`
- Required permissions: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`
- App is in Development mode for testing

### Supabase RLS Issues
If you still get 403 errors:
1. Check that the SQL script ran successfully
2. Verify user authentication is working
3. Check browser console for detailed error messages
4. Ensure the user has a valid session

## Production Deployment 🚀

For production deployment:
- Use a real SSL certificate (not self-signed)
- Update Facebook App settings with production domain
- Set proper CORS and security headers
- Use environment-specific Facebook App IDs

## Next Steps 📋

1. ✅ Apply Supabase RLS fix
2. ✅ Start HTTPS development server
3. ✅ Test Facebook login
4. ✅ Test Facebook posting
5. ⏳ Update Facebook App configuration if needed
6. ⏳ Test with real Facebook pages
7. ⏳ Prepare for production deployment
