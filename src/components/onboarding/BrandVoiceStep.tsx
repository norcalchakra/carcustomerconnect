import React, { useState, useEffect } from 'react';
import { BrandVoiceSettings } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface BrandVoiceStepProps {
  brandVoice: BrandVoiceSettings | null;
  onSave: (brandVoice: BrandVoiceSettings) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const BrandVoiceStep: React.FC<BrandVoiceStepProps> = ({
  brandVoice,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<BrandVoiceSettings>({
    id: dealershipId || 0,
    formality_level: 5, // 1-10 scale (casual to formal)
    energy_level: 5, // 1-10 scale (understated to high energy)
    technical_detail: 5, // 1-10 scale (benefit-focused to feature-heavy)
    community_connection: 5, // 1-10 scale (universal to hyper-local)
    primary_emotions: [],
    value_propositions: [],
    tone_keywords: [],
    avoid_tone_keywords: [],
    example_phrases: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Load existing brand voice data if available
  useEffect(() => {
    if (brandVoice) {
      setFormData(brandVoice);
    }
  }, [brandVoice]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAiSuggestions('brand_voice', {
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
  }, [aiAssistEnabled, dealershipId]);

  // Generate preview based on current settings
  useEffect(() => {
    const generatePreview = async () => {
      if (dealershipId) {
        try {
          const previewText = await dealerOnboardingApi.generateBrandVoicePreview(dealershipId, formData);
          setPreview(previewText);
        } catch (err) {
          console.error('Error generating preview:', err);
        }
      }
    };

    // Only generate preview if we have some data to work with
    if (formData.tone_keywords.length > 0 || formData.primary_emotions.length > 0) {
      generatePreview();
    }
  }, [dealershipId, formData]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value)
    });
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value.split('\n').filter(item => item.trim() !== '')
    });
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
    <div className="onboarding-step brand-voice-step">
      <h2>Brand Voice Configuration</h2>
      <p className="step-description">
        Define how your dealership communicates with customers. This will influence the tone and style of AI-generated content.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Voice Characteristics</h3>
          <p className="section-description">
            Adjust these sliders to define your brand's communication style.
          </p>

          <div className="slider-group">
            <label htmlFor="formality_level">Formality Level</label>
            <div className="slider-container">
              <span className="slider-label">Casual</span>
              <input
                type="range"
                id="formality_level"
                name="formality_level"
                min="1"
                max="10"
                value={formData.formality_level}
                onChange={handleSliderChange}
              />
              <span className="slider-label">Formal</span>
              <span className="slider-value">{formData.formality_level}</span>
            </div>
          </div>

          <div className="slider-group">
            <label htmlFor="energy_level">Energy Level</label>
            <div className="slider-container">
              <span className="slider-label">Understated</span>
              <input
                type="range"
                id="energy_level"
                name="energy_level"
                min="1"
                max="10"
                value={formData.energy_level}
                onChange={handleSliderChange}
              />
              <span className="slider-label">High Energy</span>
              <span className="slider-value">{formData.energy_level}</span>
            </div>
          </div>

          <div className="slider-group">
            <label htmlFor="technical_detail">Technical Detail</label>
            <div className="slider-container">
              <span className="slider-label">Benefit-Focused</span>
              <input
                type="range"
                id="technical_detail"
                name="technical_detail"
                min="1"
                max="10"
                value={formData.technical_detail}
                onChange={handleSliderChange}
              />
              <span className="slider-label">Feature-Heavy</span>
              <span className="slider-value">{formData.technical_detail}</span>
            </div>
          </div>

          <div className="slider-group">
            <label htmlFor="community_connection">Community Connection</label>
            <div className="slider-container">
              <span className="slider-label">Universal</span>
              <input
                type="range"
                id="community_connection"
                name="community_connection"
                min="1"
                max="10"
                value={formData.community_connection}
                onChange={handleSliderChange}
              />
              <span className="slider-label">Hyper-Local</span>
              <span className="slider-value">{formData.community_connection}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Brand Voice Details</h3>
          <p className="section-description">
            Enter one item per line in each of the following fields.
          </p>

          <div className="form-group">
            <label htmlFor="primary_emotions">Primary Emotions to Evoke</label>
            <textarea
              id="primary_emotions"
              name="primary_emotions"
              value={formData.primary_emotions.join('\n')}
              onChange={handleArrayChange}
              placeholder="e.g. Trust&#10;Excitement&#10;Confidence"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="value_propositions">Key Value Propositions</label>
            <textarea
              id="value_propositions"
              name="value_propositions"
              value={formData.value_propositions.join('\n')}
              onChange={handleArrayChange}
              placeholder="e.g. Family-owned for 30 years&#10;Award-winning service&#10;Largest selection in the region"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tone_keywords">Tone Keywords (Use These)</label>
            <textarea
              id="tone_keywords"
              name="tone_keywords"
              value={formData.tone_keywords.join('\n')}
              onChange={handleArrayChange}
              placeholder="e.g. Friendly&#10;Professional&#10;Knowledgeable"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="avoid_tone_keywords">Avoid These Tones</label>
            <textarea
              id="avoid_tone_keywords"
              name="avoid_tone_keywords"
              value={formData.avoid_tone_keywords.join('\n')}
              onChange={handleArrayChange}
              placeholder="e.g. Pushy&#10;Overly technical&#10;Impersonal"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="example_phrases">Example Phrases That Capture Your Voice</label>
            <textarea
              id="example_phrases"
              name="example_phrases"
              value={formData.example_phrases.join('\n')}
              onChange={handleArrayChange}
              placeholder="e.g. We're not just selling cars, we're building relationships.&#10;Your journey matters to us.&#10;Drive with confidence, service with a smile."
              rows={4}
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
                {aiSuggestions.primary_emotions && formData.primary_emotions.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Emotions:</strong> {aiSuggestions.primary_emotions.join(', ')}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('primary_emotions', aiSuggestions.primary_emotions)}
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                {aiSuggestions.tone_keywords && formData.tone_keywords.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Tone Keywords:</strong> {aiSuggestions.tone_keywords.join(', ')}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('tone_keywords', aiSuggestions.tone_keywords)}
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                {aiSuggestions.avoid_tone_keywords && formData.avoid_tone_keywords.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Tones to Avoid:</strong> {aiSuggestions.avoid_tone_keywords.join(', ')}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('avoid_tone_keywords', aiSuggestions.avoid_tone_keywords)}
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                {aiSuggestions.example_phrases && formData.example_phrases.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Example Phrases:</strong>
                    </p>
                    <ul>
                      {aiSuggestions.example_phrases.map((phrase: string, index: number) => (
                        <li key={index}>{phrase}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('example_phrases', aiSuggestions.example_phrases)}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {preview && (
          <div className="voice-preview">
            <h3>Voice Preview</h3>
            <p className="preview-description">
              Here's how your content might sound with these voice settings:
            </p>
            <div className="preview-content">
              {preview}
            </div>
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

export default BrandVoiceStep;
