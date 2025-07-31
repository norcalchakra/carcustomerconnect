# 🚀 Car Customer Connect - Production Deployment Setup

## Required Configuration Steps

### 1. Configure Supabase (REQUIRED)
Update these values in `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the Project URL and anon/public key

### 2. Configure Your Domain (REQUIRED)
Replace `your-domain.com` with your actual domain:
```env
VITE_APP_URL=https://your-domain.com
VITE_PRIVACY_POLICY_URL=https://your-domain.com/privacy-policy
VITE_DATA_DELETION_URL=https://your-domain.com/data-deletion
VITE_DATA_DELETION_CALLBACK_URL=https://your-domain.com/api/facebook/data-deletion-callback
```

### 3. Configure Company Information (REQUIRED for Facebook)
Update your company details:
```env
VITE_COMPANY_NAME=Your Actual Company Name
VITE_COMPANY_EMAIL=privacy@your-domain.com
VITE_SUPPORT_EMAIL=support@your-domain.com
VITE_COMPANY_ADDRESS=Your Actual Business Address
VITE_COMPANY_PHONE=Your Actual Phone Number
```

### 4. Facebook App Configuration (REQUIRED for Facebook Integration)
```env
VITE_FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```
**Where to find these:**
- Go to Facebook Developers Console
- Select your app
- Go to Settings > Basic
- Copy App ID and App Secret

### 5. API Configuration (REQUIRED for Data Deletion Callback)
Choose one option:

**Option A: Same domain (if deploying API to same server)**
```env
VITE_API_BASE_URL=https://your-domain.com/api
```

**Option B: Separate API domain (if using serverless)**
```env
VITE_API_BASE_URL=https://your-api-domain.vercel.app
```

## Quick Configuration Template

Here's a template with placeholder values you can copy:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Facebook App Configuration
VITE_FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890

# Application Configuration
VITE_APP_URL=https://carcustomerconnect.com
VITE_API_BASE_URL=https://carcustomerconnect.com/api

# Privacy Compliance URLs
VITE_PRIVACY_POLICY_URL=https://carcustomerconnect.com/privacy-policy
VITE_DATA_DELETION_URL=https://carcustomerconnect.com/data-deletion
VITE_DATA_DELETION_CALLBACK_URL=https://carcustomerconnect.com/api/facebook/data-deletion-callback

# Contact Information
VITE_COMPANY_NAME=Car Customer Connect LLC
VITE_COMPANY_EMAIL=privacy@carcustomerconnect.com
VITE_SUPPORT_EMAIL=support@carcustomerconnect.com
VITE_COMPANY_ADDRESS=123 Business St, City, State 12345
VITE_COMPANY_PHONE=+1-555-123-4567
```

## Next Steps After Configuration

1. **Update `.env.production`** with your actual values
2. **Run deployment check**: `npm run deploy:check`
3. **Build the application**: `npm run build`
4. **Deploy to Hostinger** following the deployment guide
5. **Configure Facebook App** with your production URLs

## Important Notes

- ⚠️ **Never commit `.env.production`** to version control
- ✅ **All URLs must use HTTPS** for Facebook compliance
- 🔒 **Keep your Facebook App Secret secure** - only use on server-side
- 📧 **Use real email addresses** that you can monitor for privacy requests
