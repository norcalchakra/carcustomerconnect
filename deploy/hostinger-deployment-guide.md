# Hostinger Deployment Guide for Car Customer Connect

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all required environment variables
- [ ] Verify Supabase URLs and keys
- [ ] Configure Facebook App ID and Secret
- [ ] Set correct domain URLs for privacy compliance

### 2. Facebook App Configuration
- [ ] Update Facebook App settings with production URLs:
  - **Privacy Policy URL**: `https://your-domain.com/privacy-policy`
  - **Data Deletion Request URL**: `https://your-domain.com/data-deletion`
  - **Data Deletion Callback URL**: `https://your-domain.com/api/facebook/data-deletion-callback`
- [ ] Add production domain to Facebook App domains
- [ ] Configure Facebook App for production use

### 3. Database Migration
- [ ] Run Supabase migrations in production
- [ ] Verify all tables are created correctly
- [ ] Test database connectivity

## Deployment Steps

### Step 1: Build the Application
```bash
# Install dependencies
npm install

# Build for production
npm run build
```

The build will create a `dist/` folder with all the production files.

### Step 2: Prepare Files for Upload
The `dist/` folder contains all files needed for deployment:
- `index.html` - Main application entry point
- `assets/` - JavaScript, CSS, and other assets
- `facebook-compliance/` - Documentation for Facebook app review

### Step 3: Upload to Hostinger
1. **Access Hostinger File Manager** or use FTP/SFTP
2. **Navigate to public_html** (or your domain's root directory)
3. **Upload all contents** of the `dist/` folder to the root
4. **Set file permissions** (755 for directories, 644 for files)

### Step 4: Configure Hostinger Settings
1. **Enable HTTPS** (required for Facebook callbacks)
2. **Configure redirects** for SPA routing:
   ```apache
   # .htaccess file for React Router
   RewriteEngine On
   RewriteBase /
   
   # Handle Angular and React Router
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   
   # Security headers
   Header always set X-Content-Type-Options nosniff
   Header always set X-Frame-Options DENY
   Header always set X-XSS-Protection "1; mode=block"
   Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
   ```

### Step 5: Verify Deployment
- [ ] Visit your domain and verify the app loads
- [ ] Test privacy policy page: `https://your-domain.com/privacy-policy`
- [ ] Test data deletion page: `https://your-domain.com/data-deletion`
- [ ] Verify HTTPS is working (required for Facebook)
- [ ] Test Facebook login integration

## Facebook App Review Submission

### Required URLs for Facebook
1. **Privacy Policy URL**: `https://your-domain.com/privacy-policy`
2. **Terms of Service URL**: `https://your-domain.com/privacy-policy` (can be same as privacy policy)
3. **Data Deletion Instructions URL**: `https://your-domain.com/data-deletion`

### App Review Documentation
Provide Facebook reviewers with:
- Link to app review guide: `https://your-domain.com/facebook-compliance/app-review-guide.md`
- Test account credentials (if required)
- Screen recordings of app functionality
- Detailed use case descriptions

### Permissions to Request
- `pages_show_list` - To display connected Facebook Pages
- `pages_manage_posts` - To create and publish posts to Pages
- `pages_read_engagement` - To read basic engagement metrics (optional)

## Post-Deployment Tasks

### 1. Monitor Application
- Check server logs for errors
- Monitor Facebook API usage
- Verify data deletion callback functionality

### 2. Performance Optimization
- Enable Hostinger caching if available
- Optimize images and assets
- Monitor page load speeds

### 3. Security Measures
- Regularly update dependencies
- Monitor for security vulnerabilities
- Keep Facebook App Secret secure

## Troubleshooting

### Common Issues
1. **App doesn't load**: Check .htaccess configuration for SPA routing
2. **Facebook login fails**: Verify domain is added to Facebook App settings
3. **HTTPS issues**: Ensure SSL certificate is properly configured
4. **API errors**: Check environment variables and Supabase configuration

### Support Contacts
- **Hostinger Support**: Use their help center or live chat
- **Facebook Developer Support**: Use Facebook Developer Community
- **Supabase Support**: Check Supabase documentation and Discord

## Maintenance Schedule

### Weekly
- [ ] Check application performance
- [ ] Review error logs
- [ ] Monitor Facebook API usage

### Monthly
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Backup database

### Quarterly
- [ ] Review Facebook App compliance
- [ ] Update privacy policy if needed
- [ ] Performance optimization review

## Emergency Procedures

### If Facebook App is Suspended
1. Review Facebook's notification email
2. Address any compliance issues
3. Update privacy policy or data deletion process if needed
4. Resubmit for review

### If Site Goes Down
1. Check Hostinger status
2. Verify DNS settings
3. Check .htaccess configuration
4. Contact Hostinger support if needed

## Contact Information
- **Technical Issues**: dev@your-domain.com
- **Privacy Concerns**: privacy@your-domain.com
- **General Support**: support@your-domain.com
