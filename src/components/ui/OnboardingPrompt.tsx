import React from 'react';
import FlashingButton from './FlashingButton';
import './FlashingButton.css';

interface OnboardingPromptProps {
  userName?: string;
}

const OnboardingPrompt: React.FC<OnboardingPromptProps> = ({ userName }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="comic-panel comic-panel-primary bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 text-center">
        {/* Comic-style header */}
        <div className="speech-bubble speech-bubble-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🦇 Welcome to Car Customer Connect! 🦇
          </h1>
        </div>

        {/* Main message */}
        <div className="mb-8">
          <p className="text-xl text-gray-700 mb-4">
            {userName ? `Hey ${userName}!` : 'Hey there!'} 
          </p>
          <p className="text-lg text-gray-600 mb-6">
            Before you can start managing your vehicles and creating amazing social media content, 
            we need to set up your dealership profile.
          </p>
          
          {/* Comic-style callout */}
          <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">💡</span>
            </div>
            <p className="text-gray-800 font-semibold">
              The onboarding wizard will help you configure your dealership's unique voice, 
              brand settings, and AI-powered content generation preferences.
            </p>
          </div>
        </div>

        {/* Flashing CTA Button */}
        <div className="mb-6">
          <FlashingButton 
            to="/dealer-onboarding" 
            className="flashing-button text-2xl px-12 py-6"
          >
            🚀 START DEALERSHIP SETUP 🚀
          </FlashingButton>
        </div>

        {/* Additional info */}
        <div className="text-sm text-gray-500">
          <p>This will only take a few minutes and you can always update your settings later.</p>
        </div>

        {/* Comic-style decorative elements */}
        <div className="absolute -top-4 -left-4 text-6xl opacity-20 transform -rotate-12">
          💥
        </div>
        <div className="absolute -top-4 -right-4 text-6xl opacity-20 transform rotate-12">
          ⚡
        </div>
        <div className="absolute -bottom-4 -left-4 text-6xl opacity-20 transform rotate-12">
          🌟
        </div>
        <div className="absolute -bottom-4 -right-4 text-6xl opacity-20 transform -rotate-12">
          💫
        </div>
      </div>
    </div>
  );
};

export default OnboardingPrompt;
