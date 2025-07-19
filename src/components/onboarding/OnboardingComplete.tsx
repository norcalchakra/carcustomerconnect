import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import '../../styles/modern-onboarding.css';

interface OnboardingCompleteProps {
  dealershipId: number | null;
  onboardingProgress: number[];
  totalSteps: number;
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({
  dealershipId,
  onboardingProgress,
  totalSteps
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dealershipSummary, setDealershipSummary] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(true);

  // Calculate completion percentage
  const completionPercentage = Math.round((onboardingProgress.length / totalSteps) * 100);

  useEffect(() => {
    const fetchDealershipSummary = async () => {
      if (dealershipId) {
        setIsLoading(true);
        try {
          const summary = await dealerOnboardingApi.getDealershipSummary(dealershipId);
          setDealershipSummary(summary);
        } catch (err) {
          console.error('Error fetching dealership summary:', err);
          setError('Failed to load dealership summary');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDealershipSummary();

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [dealershipId]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleEditOnboarding = () => {
    // Go back to the first step
    window.scrollTo(0, 0);
    window.history.pushState({}, '', window.location.pathname);
  };

  const renderConfetti = () => {
    if (!showConfetti) return null;

    return (
      <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={i} 
            className="confetti" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="onboarding-step onboarding-complete">
      {renderConfetti()}
      
      <div className="completion-header">
        <h2>Onboarding Complete!</h2>
        <div className="completion-badge">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{completionPercentage}% Complete</span>
        </div>
      </div>

      <p className="completion-message">
        Congratulations! You've successfully completed the dealer onboarding process. 
        Your dealership profile is now set up and ready to generate AI-powered content.
      </p>

      {isLoading ? (
        <div className="loading-spinner">Loading summary...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : dealershipSummary ? (
        <div className="dealership-summary">
          <h3>Dealership Summary</h3>
          
          <div className="summary-section">
            <h4>Business Profile</h4>
            <div className="summary-content">
              <p><strong>Name:</strong> {dealershipSummary.profile?.legal_name || dealershipSummary.profile?.dealership_name || 'Not specified'}</p>
              <p><strong>Location:</strong> {dealershipSummary.profile?.city || 'Not specified'}{dealershipSummary.profile?.state ? `, ${dealershipSummary.profile.state}` : ''}</p>
              <p><strong>Brands:</strong> {dealershipSummary.profile?.brands_carried?.join(', ') || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="summary-section">
            <h4>Brand Voice</h4>
            <div className="summary-content">
              <div className="voice-attributes">
                {dealershipSummary.brandVoice?.formality_level !== undefined && (
                  <div className="voice-attribute">
                    <span>Formality</span>
                    <div className="attribute-bar">
                      <div 
                        className="attribute-fill" 
                        style={{ width: `${(dealershipSummary.brandVoice.formality_level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {dealershipSummary.brandVoice?.energy_level !== undefined && (
                  <div className="voice-attribute">
                    <span>Energy</span>
                    <div className="attribute-bar">
                      <div 
                        className="attribute-fill" 
                        style={{ width: `${(dealershipSummary.brandVoice.energy_level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {dealershipSummary.brandVoice?.emoji_usage_level !== undefined && (
                  <div className="voice-attribute">
                    <span>Emoji Usage</span>
                    <div className="attribute-bar">
                      <div 
                        className="attribute-fill" 
                        style={{ width: `${(dealershipSummary.brandVoice.emoji_usage_level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {dealershipSummary.brandVoice?.technical_detail_preference && (
                <p><strong>Technical Detail:</strong> {dealershipSummary.brandVoice.technical_detail_preference}</p>
              )}
              
              {dealershipSummary.brandVoice?.community_connection && (
                <p><strong>Community Connection:</strong> {dealershipSummary.brandVoice.community_connection}</p>
              )}
            </div>
          </div>
          
          <div className="summary-section">
            <h4>Content Stats</h4>
            <div className="summary-content stats-grid">
              <div className="stat-item">
                <div className="stat-value">{dealershipSummary.templates?.count || 0}</div>
                <div className="stat-label">Lifecycle Templates</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dealershipSummary.differentiators?.count || 0}</div>
                <div className="stat-label">Differentiators</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dealershipSummary.templates?.stages || 0}</div>
                <div className="stat-label">Lifecycle Stages</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dealershipSummary.integrations ? 'Yes' : 'No'}</div>
                <div className="stat-label">Integrations</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="next-steps">
        <h3>Next Steps</h3>
        <ul>
          <li>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go to your dashboard to start creating AI-generated content
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload vehicle photos to generate captions
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Schedule automated posts for your inventory
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Review and refine your onboarding settings anytime
          </li>
        </ul>
      </div>

      <div className="form-actions completion-actions">
        <button 
          type="button" 
          className="secondary-button"
          onClick={handleEditOnboarding}
        >
          Edit Onboarding
        </button>
        <button 
          type="button" 
          className="primary-button"
          onClick={handleGoToDashboard}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default OnboardingComplete;
