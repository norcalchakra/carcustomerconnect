import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDeletionStatus } from '../lib/facebookDataDeletion';
import './DataDeletionStatus.css';

interface DeletionStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
  message: string;
  created_at: string;
  updated_at: string;
}

const DataDeletionStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const confirmationId = searchParams.get('id');

  useEffect(() => {
    const fetchStatus = async () => {
      if (!confirmationId) {
        setError('No confirmation ID provided');
        setLoading(false);
        return;
      }

      try {
        const deletionStatus = await getDeletionStatus(confirmationId);
        if (deletionStatus) {
          setStatus(deletionStatus);
        } else {
          setError('Deletion request not found');
        }
      } catch (err) {
        setError('Failed to fetch deletion status');
        console.error('Error fetching deletion status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [confirmationId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#ffc107';
      case 'IN_PROGRESS':
        return '#17a2b8';
      case 'COMPLETED':
        return '#28a745';
      case 'ERROR':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'IN_PROGRESS':
        return '🔄';
      case 'COMPLETED':
        return '✅';
      case 'ERROR':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="status-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading deletion status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="status-content">
          <div className="error-state">
            <h1>❌ Error</h1>
            <p>{error}</p>
            <div className="help-section">
              <h3>Need Help?</h3>
              <p>If you believe this is an error, please contact our support team:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> privacy@carcustomerconnect.com</p>
                <p><strong>Support:</strong> support@carcustomerconnect.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="status-container">
        <div className="status-content">
          <div className="not-found-state">
            <h1>🔍 Request Not Found</h1>
            <p>The deletion request with the provided confirmation ID was not found.</p>
            <div className="help-section">
              <h3>Possible Reasons:</h3>
              <ul>
                <li>The confirmation ID may be incorrect</li>
                <li>The request may have expired (after 90 days)</li>
                <li>The request may have been processed and archived</li>
              </ul>
              <p>If you need assistance, please contact our privacy team at privacy@carcustomerconnect.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <div className="status-content">
        <h1>Data Deletion Request Status</h1>
        
        <div className="status-card">
          <div className="status-header">
            <div 
              className="status-icon"
              style={{ color: getStatusColor(status.status) }}
            >
              {getStatusIcon(status.status)}
            </div>
            <div className="status-info">
              <h2 style={{ color: getStatusColor(status.status) }}>
                {status.status.replace('_', ' ')}
              </h2>
              <p className="confirmation-id">
                <strong>Confirmation ID:</strong> {confirmationId}
              </p>
            </div>
          </div>
          
          <div className="status-details">
            <div className="status-message">
              <h3>Status Details</h3>
              <p>{status.message}</p>
            </div>
            
            <div className="timeline">
              <div className="timeline-item">
                <strong>Request Submitted:</strong>
                <span>{formatDate(status.created_at)}</span>
              </div>
              <div className="timeline-item">
                <strong>Last Updated:</strong>
                <span>{formatDate(status.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {status.status === 'PENDING' && (
          <div className="info-box pending-info">
            <h3>⏳ What happens next?</h3>
            <p>Your data deletion request has been received and is in the queue for processing. We will begin the deletion process within 24 hours.</p>
            <ul>
              <li>Facebook access tokens will be revoked immediately</li>
              <li>Account data deletion will begin within 24 hours</li>
              <li>Complete deletion will be finished within 30 days</li>
            </ul>
          </div>
        )}

        {status.status === 'IN_PROGRESS' && (
          <div className="info-box progress-info">
            <h3>🔄 Deletion in Progress</h3>
            <p>We are currently processing your data deletion request. This process may take up to 30 days to complete.</p>
            <ul>
              <li>Facebook integration data is being removed</li>
              <li>Account and vehicle data is being deleted</li>
              <li>System logs are being cleaned</li>
            </ul>
            <p><strong>Note:</strong> You can check this page anytime for updates.</p>
          </div>
        )}

        {status.status === 'COMPLETED' && (
          <div className="info-box success-info">
            <h3>✅ Deletion Completed</h3>
            <p>Your data deletion request has been successfully completed. All your personal data has been permanently removed from our systems.</p>
            <div className="completion-details">
              <h4>What was deleted:</h4>
              <ul>
                <li>Your account information and profile</li>
                <li>All vehicle inventory data</li>
                <li>Facebook integration data and access tokens</li>
                <li>Generated social media content</li>
                <li>Usage logs and analytics data</li>
              </ul>
            </div>
            <p><strong>Important:</strong> This action cannot be undone. If you wish to use our services again, you will need to create a new account.</p>
          </div>
        )}

        {status.status === 'ERROR' && (
          <div className="info-box error-info">
            <h3>❌ Deletion Error</h3>
            <p>We encountered an issue while processing your data deletion request. Our privacy team has been notified and will resolve this manually.</p>
            <div className="error-actions">
              <h4>What you can do:</h4>
              <ul>
                <li>Wait for our team to resolve the issue (usually within 48 hours)</li>
                <li>Contact our privacy team directly for immediate assistance</li>
                <li>Check back on this page for status updates</li>
              </ul>
            </div>
          </div>
        )}

        <div className="contact-section">
          <h3>Need Help or Have Questions?</h3>
          <p>Our privacy team is here to help with any questions about your data deletion request.</p>
          <div className="contact-info">
            <div className="contact-item">
              <strong>Privacy Team:</strong>
              <a href="mailto:privacy@carcustomerconnect.com">privacy@carcustomerconnect.com</a>
            </div>
            <div className="contact-item">
              <strong>General Support:</strong>
              <a href="mailto:support@carcustomerconnect.com">support@carcustomerconnect.com</a>
            </div>
            <div className="contact-item">
              <strong>Response Time:</strong>
              Within 48 hours
            </div>
          </div>
        </div>

        <div className="actions">
          <button 
            onClick={() => window.location.reload()} 
            className="refresh-button"
          >
            🔄 Refresh Status
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            className="home-button"
          >
            🏠 Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionStatus;
