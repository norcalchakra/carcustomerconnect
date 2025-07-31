# Car Customer Connect - Facebook App Review Guide

## Overview
Car Customer Connect is a dealership management application that integrates with Facebook to enable social media posting and page management for automotive dealerships.

## App Purpose and Functionality
- **Primary Purpose**: Help car dealerships manage their vehicle inventory and create social media content
- **Facebook Integration**: Enables posting to dealership Facebook Pages with AI-generated content
- **Target Users**: Car dealership owners, managers, and marketing staff

## Data Usage and Privacy Compliance

### Data We Access from Facebook
1. **Page Information**: Basic page details for connected dealership Facebook Pages
2. **Page Access Tokens**: To enable posting functionality
3. **User Profile**: Basic profile information for authentication

### How We Use Facebook Data
- **Posting Content**: Create and publish posts to connected Facebook Pages
- **Page Management**: Display connected pages in our interface
- **Authentication**: Verify user identity for secure access

### Data Storage and Security
- All Facebook access tokens are encrypted and stored securely
- User data is stored in Supabase with enterprise-grade security
- No Facebook data is shared with third parties
- Data retention follows our published privacy policy

## Privacy Policy Compliance
- **URL**: `/privacy-policy`
- **Public Access**: Yes, no authentication required
- **Content**: Comprehensive privacy policy covering all data practices
- **Facebook-Specific**: Dedicated section for Facebook data handling

## Data Deletion Compliance
- **URL**: `/data-deletion`
- **Public Access**: Yes, no authentication required
- **Functionality**: Complete user data deletion including Facebook integration data
- **Process**: User submits request → Data deletion initiated → Confirmation provided

## Permissions Requested
1. **pages_show_list**: To display connected Facebook Pages
2. **pages_manage_posts**: To create and publish posts to Pages
3. **pages_read_engagement**: To read basic engagement metrics (optional)

## User Experience Flow
1. User creates account in Car Customer Connect
2. User connects their Facebook account (optional)
3. User selects which Facebook Pages to connect
4. User creates social media content using our AI tools
5. User posts content to connected Facebook Pages
6. User can disconnect Facebook integration at any time

## Data Deletion Process
1. User visits `/data-deletion` page
2. User submits deletion request with email verification
3. System initiates deletion of all user data including:
   - Account information
   - Vehicle data
   - Facebook access tokens
   - Generated content
4. User receives confirmation code and status URL
5. Deletion completed within 30 days

## Contact Information
- **Privacy Email**: privacy@carcustomerconnect.com
- **Support Email**: support@carcustomerconnect.com
- **Response Time**: Within 48 hours

## Technical Implementation
- **Framework**: React with TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Facebook SDK**: Meta for Developers JavaScript SDK
- **Hosting**: Hostinger (production)

## Compliance Certifications
- GDPR compliant data handling
- CCPA compliant privacy practices
- SOC 2 compliant infrastructure (via Supabase)

## Review Notes for Facebook Team
- This application is designed specifically for legitimate business use by car dealerships
- All Facebook integrations are used solely for business social media management
- No spam or automated posting without user initiation
- Strict adherence to Facebook Platform Policies
- Regular security audits and updates

## Testing Instructions
1. Create a test dealership account
2. Connect a test Facebook Page
3. Create sample vehicle content
4. Test posting functionality
5. Test data deletion process
6. Verify privacy policy accessibility

Last Updated: ${new Date().toLocaleDateString()}
