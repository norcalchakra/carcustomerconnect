import React, { useState, useEffect } from 'react';
import { DealershipProfile } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface BusinessProfileStepProps {
  profile: DealershipProfile | null;
  onSave: (profile: DealershipProfile) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const BusinessProfileStep: React.FC<BusinessProfileStepProps> = ({
  profile,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<DealershipProfile>({
    id: dealershipId || 0,
    legal_name: '',
    marketing_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    years_in_business: 0,
    dealership_type: 'new',
    brands_carried: [],
    market_radius: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing profile data if available
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId && formData.legal_name) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAiSuggestions('business_profile', {
            dealershipId,
            partialData: formData
          });
          setAiSuggestions(suggestions);
        } catch (err) {
          console.error('Error getting AI suggestions:', err);
          setError('Failed to get AI suggestions');
        } finally {
          setIsLoading(false);
        }
      }
    };

    getAiSuggestions();
  }, [aiAssistEnabled, dealershipId, formData.legal_name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'brands_carried') {
      // Handle brands as a comma-separated list
      setFormData({
        ...formData,
        brands_carried: value.split(',').map(brand => brand.trim())
      });
    } else if (name === 'years_in_business' || name === 'market_radius') {
      // Convert numeric fields
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else {
      // Handle all other fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updated_at: new Date().toISOString()
    });
  };

  const applySuggestion = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="onboarding-step business-profile-step">
      <h2>Business Profile</h2>
      <p className="step-description">
        Tell us about your dealership. This information will be used to personalize your AI-generated content.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="legal_name">Legal Business Name*</label>
            <input
              type="text"
              id="legal_name"
              name="legal_name"
              value={formData.legal_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="marketing_name">Marketing/DBA Name</label>
            <input
              type="text"
              id="marketing_name"
              name="marketing_name"
              value={formData.marketing_name}
              onChange={handleChange}
              placeholder="If different from legal name"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="address">Street Address*</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City*</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State*</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="zip_code">ZIP Code*</label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number*</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website URL</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="years_in_business">Years in Business</label>
            <input
              type="number"
              id="years_in_business"
              name="years_in_business"
              value={formData.years_in_business}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dealership_type">Dealership Type*</label>
            <select
              id="dealership_type"
              name="dealership_type"
              value={formData.dealership_type}
              onChange={handleChange}
              required
            >
              <option value="new">New Vehicles</option>
              <option value="used">Used Vehicles</option>
              <option value="both">New & Used Vehicles</option>
              <option value="specialty">Specialty Vehicles</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="market_radius">Market Radius (miles)</label>
            <input
              type="number"
              id="market_radius"
              name="market_radius"
              value={formData.market_radius}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="brands_carried">Brands Carried (comma-separated)</label>
            <input
              type="text"
              id="brands_carried"
              name="brands_carried"
              value={formData.brands_carried.join(', ')}
              onChange={handleChange}
              placeholder="e.g. Toyota, Honda, Ford"
            />
          </div>
        </div>

        {aiAssistEnabled && aiSuggestions && (
          <div className="ai-suggestions">
            <h3>AI Suggestions</h3>
            {isLoading ? (
              <p>Loading suggestions...</p>
            ) : (
              <>
                {aiSuggestions.marketing_name && formData.marketing_name === '' && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Marketing Name:</strong> {aiSuggestions.marketing_name}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('marketing_name', aiSuggestions.marketing_name)}
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                {aiSuggestions.market_radius && formData.market_radius === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Market Radius:</strong> {aiSuggestions.market_radius} miles
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('market_radius', aiSuggestions.market_radius)}
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                {aiSuggestions.brands_carried && formData.brands_carried.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Brands:</strong> {aiSuggestions.brands_carried.join(', ')}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('brands_carried', aiSuggestions.brands_carried)}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="save-button">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfileStep;
