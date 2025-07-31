import React, { useState } from 'react';
import { submitDataDeletionRequest } from '../lib/facebookDataDeletion';
import './DataDeletion.css';

const DataDeletion: React.FC = () => {
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Submit the data deletion request using the browser-compatible function
      const result = await submitDataDeletionRequest({
        email,
        reason: 'User requested data deletion via website',
        facebook_connected: true // Assume Facebook connection for now
      });
      
      if (result.success && result.confirmationCode) {
        setConfirmationCode(result.confirmationCode);
        setRequestSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit deletion request. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit deletion request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = () => {
    // This would typically check the status of the deletion request
    // For now, we'll just show a message
    alert('Your data deletion request is being processed. You will receive an email confirmation once completed.');
  };

  if (requestSubmitted) {
    return (
      <div className="data-deletion-container">
        <div className="data-deletion-content">
          <div className="success-message">
            <h1>Data Deletion Request Submitted</h1>
            <div className="confirmation-box">
              <h2>Confirmation Details</h2>
              <p><strong>Confirmation Code:</strong> {confirmationCode}</p>
              <p><strong>Email:</strong> {email}</p>
              <p><strong>Request Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="next-steps">
              <h3>What Happens Next?</h3>
              <ul>
                <li>We will begin processing your data deletion request within 24 hours</li>
                <li>You will receive an email confirmation at the provided address</li>
                <li>The deletion process typically takes 30 days to complete</li>
                <li>You can check the status of your request using the confirmation code above</li>
              </ul>
            </div>

            <div className="action-buttons">
              <button onClick={handleCheckStatus} className="status-button">
                Check Status
              </button>
              <button onClick={() => window.location.href = '/'} className="home-button">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-deletion-container">
      <div className="data-deletion-content">
        <h1>Data Deletion Request</h1>
        <p className="intro-text">
          You can request the deletion of your personal data from Car Customer Connect. 
          This process is irreversible and will permanently remove all your account information, 
          vehicle data, and associated records.
        </p>

        <div className="warning-box">
          <h3>⚠️ Important Notice</h3>
          <p>
            Once you submit a data deletion request, you will no longer be able to access your account 
            or recover any of your data. Please ensure you have downloaded any important information 
            before proceeding.
          </p>
        </div>

        <div className="data-types-section">
          <h2>Data That Will Be Deleted</h2>
          <ul>
            <li>Account information (name, email, phone number)</li>
            <li>Dealership profile and settings</li>
            <li>Vehicle inventory and records</li>
            <li>Social media integration data</li>
            <li>Generated content and captions</li>
            <li>Usage analytics and preferences</li>
            <li>Support communications and feedback</li>
          </ul>
        </div>

        <div className="facebook-section">
          <h2>Facebook Data Deletion</h2>
          <p>
            If you connected your Facebook account to Car Customer Connect, this request will also:
          </p>
          <ul>
            <li>Remove our access to your Facebook Page information</li>
            <li>Delete any stored Facebook access tokens</li>
            <li>Revoke posting permissions to your Facebook Pages</li>
            <li>Remove any cached Facebook data from our systems</li>
          </ul>
          <p>
            Note: This will not delete your Facebook account or any posts already made to your Facebook Pages. 
            To manage your Facebook data directly, visit your 
            <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer">
              Facebook Apps and Websites settings
            </a>.
          </p>
        </div>

        <form onSubmit={handleSubmitRequest} className="deletion-form">
          <h2>Submit Deletion Request</h2>
          
          <div className="form-group">
            <label htmlFor="email">
              Email Address Associated with Your Account *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
              className="form-input"
            />
          </div>

          <div className="confirmation-checkbox">
            <label>
              <input type="checkbox" required />
              I understand that this action is irreversible and will permanently delete all my data
            </label>
          </div>

          <div className="confirmation-checkbox">
            <label>
              <input type="checkbox" required />
              I have downloaded or saved any important information I need to keep
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit Deletion Request'}
          </button>
        </form>

        <div className="alternative-options">
          <h2>Alternative Options</h2>
          <p>If you don't want to delete all your data, you may consider these alternatives:</p>
          <ul>
            <li><strong>Account Deactivation:</strong> Temporarily disable your account without deleting data</li>
            <li><strong>Data Export:</strong> Download a copy of your data before deletion</li>
            <li><strong>Selective Deletion:</strong> Contact support to delete specific types of data only</li>
          </ul>
          <p>
            For these options, please contact us at 
            <a href="mailto:privacy@carcustomerconnect.com"> privacy@carcustomerconnect.com</a>.
          </p>
        </div>

        <div className="contact-section">
          <h2>Need Help?</h2>
          <p>
            If you have questions about data deletion or need assistance, please contact our privacy team:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> privacy@carcustomerconnect.com</p>
            <p><strong>Subject:</strong> Data Deletion Inquiry</p>
            <p><strong>Response Time:</strong> Within 48 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
