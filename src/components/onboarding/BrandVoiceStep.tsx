import React, { useState, useEffect } from 'react';
import { BrandVoiceSettings } from '../../lib/dealerOnboardingTypes';
import './OnboardingSteps.css';

interface BrandVoiceStepProps {
  onSave: (formData: BrandVoiceSettings) => void;
  brandVoice: BrandVoiceSettings | null;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const BrandVoiceStep: React.FC<BrandVoiceStepProps> = ({ onSave, brandVoice, aiAssistEnabled, dealershipId }) => {
  const [formData, setFormData] = useState<BrandVoiceSettings>({
    id: dealershipId || 0,
    formality_level: 3, 
    energy_level: 3, 
    technical_detail_preference: 'benefit-focused', 
    community_connection: 'regional', 
    emoji_usage_level: 2, 
    primary_emotions: [],
    value_propositions: [],
    tone_keywords: [],
    avoid_tone_keywords: [],
    example_phrases: [],
    updated_at: new Date().toISOString()
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brandVoice) {
      setFormData({
        id: brandVoice.id,
        formality_level: brandVoice.formality_level ?? 3,
        energy_level: brandVoice.energy_level ?? 3,
        technical_detail_preference: brandVoice.technical_detail_preference ?? 'benefit-focused',
        community_connection: brandVoice.community_connection ?? 'regional',
        emoji_usage_level: brandVoice.emoji_usage_level ?? 2,
        primary_emotions: brandVoice.primary_emotions ?? [],
        value_propositions: brandVoice.value_propositions ?? [],
        tone_keywords: brandVoice.tone_keywords ?? [],
        avoid_tone_keywords: brandVoice.avoid_tone_keywords ?? [],
        example_phrases: brandVoice.example_phrases ?? [],
        updated_at: new Date().toISOString()
      });
    }
  }, [brandVoice]);

  // Generate preview based on current settings
  useEffect(() => {
    const generatePreview = async () => {
      if (dealershipId) {
        try {
          // Since the API doesn't have a generateBrandVoicePreview function,
          // we'll generate a simple preview based on the current settings
          const emotionsText = formData.primary_emotions?.join(', ') || '';
          const toneText = formData.tone_keywords?.join(', ') || '';
          const formalityText = formData.formality_level > 4 ? 'formal' : 
                              formData.formality_level > 2 ? 'conversational' : 'casual';
          const energyText = formData.energy_level > 4 ? 'high-energy' : 
                           formData.energy_level > 2 ? 'balanced' : 'understated';
          
          const previewText = `Your brand voice is ${formalityText} and ${energyText}. ` +
                             `It aims to evoke emotions like ${emotionsText || 'trust and confidence'}. ` +
                             `The tone can be described as ${toneText || 'professional and approachable'}.`;
          
          setPreview(previewText);
        } catch (err) {
          console.error('Error generating preview:', err);
        }
      }
    };

    // Only generate preview if we have some data to work with
    if ((formData.tone_keywords?.length > 0) || (formData.primary_emotions?.length > 0)) {
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
    
    // Include all fields for saving
    const dbFormData: BrandVoiceSettings = {
      id: formData.id,
      formality_level: formData.formality_level,
      energy_level: formData.energy_level,
      technical_detail_preference: formData.technical_detail_preference,
      community_connection: formData.community_connection,
      emoji_usage_level: formData.emoji_usage_level,
      primary_emotions: formData.primary_emotions || [],
      value_propositions: formData.value_propositions || [],
      tone_keywords: formData.tone_keywords || [],
      avoid_tone_keywords: formData.avoid_tone_keywords || [],
      example_phrases: formData.example_phrases || [],
      updated_at: new Date().toISOString()
    };
    
    // Save to database
    onSave(dbFormData);
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
                max="5"
                value={formData.formality_level || 3}
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
                max="5"
                value={formData.energy_level || 3}
                onChange={handleSliderChange}
              />
              <span className="slider-label">High Energy</span>
              <span className="slider-value">{formData.energy_level}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="technical_detail_preference">Technical Detail Preference</label>
            <select
              id="technical_detail_preference"
              name="technical_detail_preference"
              value={formData.technical_detail_preference || 'benefit-focused'}
              onChange={(e) => setFormData({ ...formData, technical_detail_preference: e.target.value as 'feature-heavy' | 'benefit-focused' | 'lifestyle-oriented' })}
            >
              <option value="feature-heavy">Feature-Heavy</option>
              <option value="benefit-focused">Benefit-Focused</option>
              <option value="lifestyle-oriented">Lifestyle-Oriented</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="community_connection">Community Connection</label>
            <select
              id="community_connection"
              name="community_connection"
              value={formData.community_connection || 'regional'}
              onChange={(e) => setFormData({ ...formData, community_connection: e.target.value as 'hyper-local' | 'regional' | 'universal' })}
            >
              <option value="hyper-local">Hyper-Local</option>
              <option value="regional">Regional</option>
              <option value="universal">Universal</option>
            </select>
          </div>
          
          <div className="slider-group">
            <label htmlFor="emoji_usage_level">Emoji Usage</label>
            <div className="slider-container">
              <span className="slider-label">None</span>
              <input
                type="range"
                id="emoji_usage_level"
                name="emoji_usage_level"
                min="1"
                max="5"
                value={formData.emoji_usage_level || 2}
                onChange={handleSliderChange}
              />
              <span className="slider-label">Abundant</span>
              <span className="slider-value">{formData.emoji_usage_level}</span>
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
              value={formData.primary_emotions?.join('\n') || ''}
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
              value={formData.value_propositions?.join('\n') || ''}
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
              value={formData.tone_keywords?.join('\n') || ''}
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
              value={formData.avoid_tone_keywords?.join('\n') || ''}
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
              value={formData.example_phrases?.join('\n') || ''}
              onChange={handleArrayChange}
              placeholder="e.g. We're not just selling cars, we're building relationships.&#10;Your journey matters to us.&#10;Drive with confidence, service with a smile."
              rows={4}
            />
          </div>
        </div>

        {/* AI suggestions removed as per request */}

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
