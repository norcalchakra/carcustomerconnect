import React from 'react';
import { SocialMediaSettings } from '../components/settings/SocialMediaSettings';
import '../styles/shared-theme.css';

export const Settings: React.FC = () => {
  return (
    <div className="shared-container">
      <div className="shared-page-header">
        <h1 className="shared-page-title">Settings</h1>
        <p className="shared-page-subtitle">Manage your account preferences and integrations</p>
      </div>
      
      <div className="shared-grid shared-grid-secondary">
        <div className="shared-card">
          <h2 className="shared-card-header">Social Media Integrations</h2>
          <div className="shared-card-content">
            <SocialMediaSettings />
          </div>
        </div>
        
        <div className="shared-card">
          <h2 className="shared-card-header">Account Settings</h2>
          <div className="shared-card-content">
            <p className="shared-text-muted">Additional account settings will be available here soon.</p>
          </div>
        </div>
        
        <div className="shared-card">
          <h2 className="shared-card-header">Notification Preferences</h2>
          <div className="shared-card-content">
            <p className="shared-text-muted">Notification settings will be available here soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
