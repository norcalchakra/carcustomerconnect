import React from 'react';
import { SocialMediaSettings } from '../components/settings/SocialMediaSettings';

export const Settings: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <SocialMediaSettings />
        
        {/* Additional settings sections can be added here in the future */}
      </div>
    </div>
  );
};

export default Settings;
