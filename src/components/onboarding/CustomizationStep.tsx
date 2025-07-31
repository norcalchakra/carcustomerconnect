import React, { useState, useEffect } from 'react';
import { CustomizationParameters } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface CustomizationStepProps {
  customizationParams: CustomizationParameters | null;
  onSave: (params: CustomizationParameters) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const CustomizationStep: React.FC<CustomizationStepProps> = ({
  customizationParams,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<CustomizationParameters>({
    id: dealershipId || 0,
    seasonal_adaptations: {},
    vehicle_type_preferences: {},
    price_range_messaging: {},
    compliance_templates: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string>('seasonal');

  // Load existing customization data if available
  useEffect(() => {
    if (customizationParams) {
      setFormData(customizationParams);
    } else {
      // Initialize with default structure
      setFormData({
        id: dealershipId || 0,
        seasonal_adaptations: {
          spring: '',
          summer: '',
          fall: '',
          winter: '',
          holidays: ''
        },
        vehicle_type_preferences: {
          trucks: '',
          suvs: '',
          sedans: '',
          sports_cars: '',
          luxury: '',
          economy: '',
          electric: '',
          hybrid: ''
        },
        price_range_messaging: {
          budget: '',
          mid_range: '',
          premium: '',
          luxury: ''
        },
        compliance_templates: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }, [customizationParams, dealershipId]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAISuggestions({
            dealership_id: dealershipId,
            section: 'customization',
            current_data: { section: currentSection }
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
  }, [aiAssistEnabled, dealershipId, currentSection]);

  const handleSeasonalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      seasonal_adaptations: {
        ...formData.seasonal_adaptations,
        [name]: value
      }
    });
  };

  const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      vehicle_type_preferences: {
        ...formData.vehicle_type_preferences,
        [name]: value
      }
    });
  };

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      price_range_messaging: {
        ...formData.price_range_messaging,
        [name]: value
      }
    });
  };

  const handleComplianceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      compliance_templates: value.split('\n').filter(item => item.trim() !== '')
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updated_at: new Date().toISOString()
    });
  };

  const applySuggestion = (section: string, field: string, value: string) => {
    if (section === 'seasonal') {
      setFormData({
        ...formData,
        seasonal_adaptations: {
          ...formData.seasonal_adaptations,
          [field]: value
        }
      });
    } else if (section === 'vehicle_type') {
      setFormData({
        ...formData,
        vehicle_type_preferences: {
          ...formData.vehicle_type_preferences,
          [field]: value
        }
      });
    } else if (section === 'price_range') {
      setFormData({
        ...formData,
        price_range_messaging: {
          ...formData.price_range_messaging,
          [field]: value
        }
      });
    } else if (section === 'compliance') {
      setFormData({
        ...formData,
        compliance_templates: value.split('\n')
      });
    }
  };

  return (
    <div className="onboarding-step customization-step">
      <h2>Advanced Customization Parameters</h2>
      <p className="step-description">
        Fine-tune how your content adapts to different scenarios, vehicle types, and price ranges.
      </p>

      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-button ${currentSection === 'seasonal' ? 'active' : ''}`}
          onClick={() => setCurrentSection('seasonal')}
        >
          Seasonal
        </button>
        <button
          type="button"
          className={`tab-button ${currentSection === 'vehicle_type' ? 'active' : ''}`}
          onClick={() => setCurrentSection('vehicle_type')}
        >
          Vehicle Types
        </button>
        <button
          type="button"
          className={`tab-button ${currentSection === 'price_range' ? 'active' : ''}`}
          onClick={() => setCurrentSection('price_range')}
        >
          Price Ranges
        </button>
        <button
          type="button"
          className={`tab-button ${currentSection === 'compliance' ? 'active' : ''}`}
          onClick={() => setCurrentSection('compliance')}
        >
          Compliance
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {currentSection === 'seasonal' && (
          <div className="form-section">
            <h3>Seasonal Adaptations</h3>
            <p className="section-description">
              Define how your messaging should adapt to different seasons and holidays.
            </p>

            <div className="form-group">
              <label htmlFor="spring">Spring Messaging</label>
              <textarea
                id="spring"
                name="spring"
                value={formData.seasonal_adaptations.spring || ''}
                onChange={handleSeasonalChange}
                placeholder="How should your content adapt during spring? E.g., emphasize new beginnings, spring cleaning, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="summer">Summer Messaging</label>
              <textarea
                id="summer"
                name="summer"
                value={formData.seasonal_adaptations.summer || ''}
                onChange={handleSeasonalChange}
                placeholder="How should your content adapt during summer? E.g., road trips, vacation vehicles, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fall">Fall Messaging</label>
              <textarea
                id="fall"
                name="fall"
                value={formData.seasonal_adaptations.fall || ''}
                onChange={handleSeasonalChange}
                placeholder="How should your content adapt during fall? E.g., back to school, preparing for winter, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="winter">Winter Messaging</label>
              <textarea
                id="winter"
                name="winter"
                value={formData.seasonal_adaptations.winter || ''}
                onChange={handleSeasonalChange}
                placeholder="How should your content adapt during winter? E.g., safety features, winter driving, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="holidays">Holiday Messaging</label>
              <textarea
                id="holidays"
                name="holidays"
                value={formData.seasonal_adaptations.holidays || ''}
                onChange={handleSeasonalChange}
                placeholder="How should your content adapt during holidays? E.g., special offers, gift ideas, etc."
                rows={4}
              />
            </div>

            {aiAssistEnabled && aiSuggestions && aiSuggestions.seasonal && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  Object.entries(aiSuggestions.seasonal).map(([season, suggestion]) => {
                    const seasonKey = season as keyof typeof formData.seasonal_adaptations;
                    const currentValue = formData.seasonal_adaptations[seasonKey] || '';
                    
                    if (currentValue === '' && suggestion) {
                      return (
                        <div key={season} className="suggestion-item">
                          <p>
                            <strong>{season.charAt(0).toUpperCase() + season.slice(1)} Suggestion:</strong>
                          </p>
                          <div className="suggestion-content">{suggestion as string}</div>
                          <button
                            type="button"
                            className="apply-suggestion"
                            onClick={() => applySuggestion('seasonal', season, suggestion as string)}
                          >
                            Apply
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            )}
          </div>
        )}

        {currentSection === 'vehicle_type' && (
          <div className="form-section">
            <h3>Vehicle Type Preferences</h3>
            <p className="section-description">
              Define how your messaging should adapt to different vehicle types.
            </p>

            <div className="form-group">
              <label htmlFor="trucks">Trucks</label>
              <textarea
                id="trucks"
                name="trucks"
                value={formData.vehicle_type_preferences.trucks || ''}
                onChange={handleVehicleTypeChange}
                placeholder="How should your content adapt for trucks? E.g., emphasize towing capacity, durability, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="suvs">SUVs</label>
              <textarea
                id="suvs"
                name="suvs"
                value={formData.vehicle_type_preferences.suvs || ''}
                onChange={handleVehicleTypeChange}
                placeholder="How should your content adapt for SUVs? E.g., emphasize space, family-friendly features, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sedans">Sedans</label>
              <textarea
                id="sedans"
                name="sedans"
                value={formData.vehicle_type_preferences.sedans || ''}
                onChange={handleVehicleTypeChange}
                placeholder="How should your content adapt for sedans? E.g., emphasize fuel efficiency, comfort, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sports_cars">Sports Cars</label>
              <textarea
                id="sports_cars"
                name="sports_cars"
                value={formData.vehicle_type_preferences.sports_cars || ''}
                onChange={handleVehicleTypeChange}
                placeholder="How should your content adapt for sports cars? E.g., emphasize performance, handling, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="luxury">Luxury Vehicles</label>
              <textarea
                id="luxury"
                name="luxury"
                value={formData.vehicle_type_preferences.luxury || ''}
                onChange={handleVehicleTypeChange}
                placeholder="How should your content adapt for luxury vehicles? E.g., emphasize premium features, status, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="electric">Electric Vehicles</label>
              <textarea
                id="electric"
                name="electric"
                value={formData.vehicle_type_preferences.electric || ''}
                onChange={handleVehicleTypeChange}
                placeholder="How should your content adapt for electric vehicles? E.g., emphasize range, charging network, etc."
                rows={4}
              />
            </div>

            {aiAssistEnabled && aiSuggestions && aiSuggestions.vehicle_types && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  Object.entries(aiSuggestions.vehicle_types).map(([type, suggestion]) => {
                    const typeKey = type as keyof typeof formData.vehicle_type_preferences;
                    const currentValue = formData.vehicle_type_preferences[typeKey] || '';
                    
                    if (currentValue === '' && suggestion) {
                      return (
                        <div key={type} className="suggestion-item">
                          <p>
                            <strong>{type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)} Suggestion:</strong>
                          </p>
                          <div className="suggestion-content">{suggestion as string}</div>
                          <button
                            type="button"
                            className="apply-suggestion"
                            onClick={() => applySuggestion('vehicle_type', type, suggestion as string)}
                          >
                            Apply
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            )}
          </div>
        )}

        {currentSection === 'price_range' && (
          <div className="form-section">
            <h3>Price Range Messaging</h3>
            <p className="section-description">
              Define how your messaging should adapt to different price ranges.
            </p>

            <div className="form-group">
              <label htmlFor="budget">Budget Vehicles</label>
              <textarea
                id="budget"
                name="budget"
                value={formData.price_range_messaging.budget || ''}
                onChange={handlePriceRangeChange}
                placeholder="How should your content adapt for budget vehicles? E.g., emphasize value, affordability, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mid_range">Mid-Range Vehicles</label>
              <textarea
                id="mid_range"
                name="mid_range"
                value={formData.price_range_messaging.mid_range || ''}
                onChange={handlePriceRangeChange}
                placeholder="How should your content adapt for mid-range vehicles? E.g., emphasize balance of features and value, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="premium">Premium Vehicles</label>
              <textarea
                id="premium"
                name="premium"
                value={formData.price_range_messaging.premium || ''}
                onChange={handlePriceRangeChange}
                placeholder="How should your content adapt for premium vehicles? E.g., emphasize advanced features, quality, etc."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="luxury">Luxury Vehicles</label>
              <textarea
                id="luxury"
                name="luxury"
                value={formData.price_range_messaging.luxury || ''}
                onChange={handlePriceRangeChange}
                placeholder="How should your content adapt for luxury vehicles? E.g., emphasize exclusivity, prestige, etc."
                rows={4}
              />
            </div>

            {aiAssistEnabled && aiSuggestions && aiSuggestions.price_ranges && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  Object.entries(aiSuggestions.price_ranges).map(([range, suggestion]) => {
                    const rangeKey = range as keyof typeof formData.price_range_messaging;
                    const currentValue = formData.price_range_messaging[rangeKey] || '';
                    
                    if (currentValue === '' && suggestion) {
                      return (
                        <div key={range} className="suggestion-item">
                          <p>
                            <strong>{range.replace('_', ' ').charAt(0).toUpperCase() + range.replace('_', ' ').slice(1)} Suggestion:</strong>
                          </p>
                          <div className="suggestion-content">{suggestion as string}</div>
                          <button
                            type="button"
                            className="apply-suggestion"
                            onClick={() => applySuggestion('price_range', range, suggestion as string)}
                          >
                            Apply
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            )}
          </div>
        )}

        {currentSection === 'compliance' && (
          <div className="form-section">
            <h3>Compliance & Disclosure Templates</h3>
            <p className="section-description">
              Define standard compliance language and disclosures to include in your content.
            </p>

            <div className="form-group">
              <label htmlFor="compliance_templates">Compliance Templates (one per line)</label>
              <textarea
                id="compliance_templates"
                name="compliance_templates"
                value={formData.compliance_templates.join('\n')}
                onChange={handleComplianceChange}
                placeholder="E.g. *Price excludes tax, title, and license fees.&#10;*Offer valid for qualified buyers only.&#10;*See dealer for complete details."
                rows={6}
              />
            </div>

            {aiAssistEnabled && aiSuggestions && aiSuggestions.compliance && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Compliance Templates:</strong>
                    </p>
                    <div className="suggestion-content">
                      {aiSuggestions.compliance.join('\n')}
                    </div>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('compliance', 'compliance_templates', aiSuggestions.compliance.join('\n'))}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
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

export default CustomizationStep;
