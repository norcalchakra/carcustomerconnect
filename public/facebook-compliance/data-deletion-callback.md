# Facebook Data Deletion Callback Implementation

## Overview
This document describes the implementation of Facebook's required data deletion callback for Car Customer Connect.

## Callback URL
**Production URL**: `https://[your-domain]/api/facebook/data-deletion-callback`
**Development URL**: `http://localhost:3000/api/facebook/data-deletion-callback`

## Implementation Details

### Endpoint Specification
- **Method**: POST
- **Content-Type**: application/x-www-form-urlencoded
- **Authentication**: Facebook signed request verification

### Request Format
Facebook sends a signed request containing:
```json
{
  "algorithm": "HMAC-SHA256",
  "expires": 1291840400,
  "issued_at": 1291836800,
  "user_id": "218471"
}
```

### Response Format
Our callback returns:
```json
{
  "url": "https://[your-domain]/data-deletion-status?id=abc123",
  "confirmation_code": "abc123"
}
```

### Implementation Process

#### 1. Request Verification
- Verify the signed request using Facebook App Secret
- Extract user_id from the verified payload
- Log the deletion request for audit purposes

#### 2. Data Deletion Initiation
- Identify all user data associated with the Facebook user_id
- Mark data for deletion in our database
- Remove Facebook access tokens immediately
- Initiate background deletion process

#### 3. Response Generation
- Generate unique confirmation code
- Create status tracking URL
- Return JSON response to Facebook

### Data Deletion Scope
When a Facebook data deletion request is received, we delete:

1. **Facebook Integration Data**
   - Facebook user ID associations
   - Facebook Page access tokens
   - Facebook Page information cache
   - Posted content metadata

2. **Associated User Data** (if user account exists)
   - User account information
   - Vehicle inventory data
   - Generated social media content
   - Usage analytics and logs

3. **System Logs**
   - Authentication logs containing Facebook data
   - API request logs with Facebook identifiers
   - Error logs containing user information

### Status Tracking
Users can check deletion status at:
`https://[your-domain]/data-deletion-status?id=[confirmation_code]`

Status responses:
- `PENDING`: Deletion request received, processing started
- `IN_PROGRESS`: Deletion actively being processed
- `COMPLETED`: All data successfully deleted
- `ERROR`: Issue encountered, manual review required

### Security Measures
- All requests verified using HMAC-SHA256 signature
- Confirmation codes are cryptographically secure
- Status URLs expire after 90 days
- Audit logs maintained for compliance

### Compliance Timeline
- **Immediate**: Facebook access tokens revoked
- **Within 24 hours**: Deletion process initiated
- **Within 30 days**: All data permanently deleted
- **Within 90 days**: Audit logs archived

### Error Handling
If deletion fails:
1. Log error details for manual review
2. Notify privacy team via email
3. Update status to ERROR with reason
4. Provide contact information for user

### Testing
To test the callback:
1. Create test Facebook app integration
2. Connect test user account
3. Use Facebook's deletion test tool
4. Verify proper response format
5. Confirm data deletion completion

### Monitoring
- All deletion requests logged
- Success/failure rates monitored
- Response time tracking
- Compliance audit trail maintained

## Contact for Issues
- **Technical Issues**: dev@carcustomerconnect.com
- **Privacy Concerns**: privacy@carcustomerconnect.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

## Compliance Notes
- Meets Facebook Platform Policy requirements
- GDPR Article 17 (Right to Erasure) compliant
- CCPA deletion rights compliant
- Regular security audits performed

Last Updated: ${new Date().toLocaleDateString()}
