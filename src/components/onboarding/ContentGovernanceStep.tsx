import React, { useState, useEffect } from 'react';
import { ContentGovernance } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface ContentGovernanceStepProps {
  contentGovernance: ContentGovernance | null;
  onSave: (governance: ContentGovernance) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const ContentGovernanceStep: React.FC<ContentGovernanceStepProps> = ({
  contentGovernance,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<ContentGovernance>({
    id: dealershipId || 0,
    never_mention: [],
    always_include: [],
    hashtag_strategy: [],
    content_guidelines: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<string>('never_mention');

  // Load existing content governance data if available
  useEffect(() => {
    if (contentGovernance) {
      setFormData(contentGovernance);
    }
  }, [contentGovernance]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAiSuggestions('content_governance', {
            dealershipId
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

  const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: keyof ContentGovernance) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      [field]: value.split('\n').filter(item => item.trim() !== '')
    });
  };

  const handleContentGuidelinesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      content_guidelines: e.target.value
    });
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItem(e.target.value);
  };

  const addItem = (section: keyof ContentGovernance) => {
    if (!newItem.trim()) return;

    if (Array.isArray(formData[section])) {
      setFormData({
        ...formData,
        [section]: [...(formData[section] as string[]), newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeItem = (section: keyof ContentGovernance, index: number) => {
    if (Array.isArray(formData[section])) {
      const newArray = [...(formData[section] as string[])];
      newArray.splice(index, 1);
      setFormData({
        ...formData,
        [section]: newArray
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

  const applySuggestion = (field: keyof ContentGovernance, value: string[]) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="onboarding-step content-governance-step">
      <h2>Content Governance</h2>
      <p className="step-description">
        Define rules and guidelines for your AI-generated content to ensure it aligns with your dealership's values and marketing strategy.
      </p>

      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-button ${currentSection === 'never_mention' ? 'active' : ''}`}
          onClick={() => setCurrentSection('never_mention')}
        >
          Never Mention
        </button>
        <button
          type="button"
          className={`tab-button ${currentSection === 'always_include' ? 'active' : ''}`}
          onClick={() => setCurrentSection('always_include')}
        >
          Always Include
        </button>
        <button
          type="button"
          className={`tab-button ${currentSection === 'hashtag_strategy' ? 'active' : ''}`}
          onClick={() => setCurrentSection('hashtag_strategy')}
        >
          Hashtag Strategy
        </button>
        <button
          type="button"
          className={`tab-button ${currentSection === 'content_guidelines' ? 'active' : ''}`}
          onClick={() => setCurrentSection('content_guidelines')}
        >
          Guidelines
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {currentSection === 'never_mention' && (
          <div className="form-section">
            <h3>Never Mention List</h3>
            <p className="section-description">
              Add topics, competitors, or phrases that should never be mentioned in your content.
            </p>

            <div className="tag-input-container">
              <div className="tag-input">
                <input
                  type="text"
                  value={newItem}
                  onChange={handleNewItemChange}
                  placeholder="Add an item to never mention..."
                />
                <button
                  type="button"
                  onClick={() => addItem('never_mention')}
                  className="add-tag-button"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="tag-container">
              {formData.never_mention.map((item, index) => (
                <div key={index} className="tag">
                  {item}
                  <span
                    className="tag-remove"
                    onClick={() => removeItem('never_mention', index)}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>

            {formData.never_mention.length === 0 && (
              <p className="no-items">No items added yet. Add items that should never be mentioned in your content.</p>
            )}

            {aiAssistEnabled && aiSuggestions && aiSuggestions.never_mention && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Items to Never Mention:</strong>
                    </p>
                    <div className="tag-container">
                      {aiSuggestions.never_mention.map((item: string, index: number) => (
                        <div key={index} className="tag suggestion-tag">
                          {item}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('never_mention', aiSuggestions.never_mention)}
                    >
                      Apply All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentSection === 'always_include' && (
          <div className="form-section">
            <h3>Always Include Elements</h3>
            <p className="section-description">
              Add elements that should always be included in your content, such as taglines or key value propositions.
            </p>

            <div className="tag-input-container">
              <div className="tag-input">
                <input
                  type="text"
                  value={newItem}
                  onChange={handleNewItemChange}
                  placeholder="Add an element to always include..."
                />
                <button
                  type="button"
                  onClick={() => addItem('always_include')}
                  className="add-tag-button"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="tag-container">
              {formData.always_include.map((item, index) => (
                <div key={index} className="tag">
                  {item}
                  <span
                    className="tag-remove"
                    onClick={() => removeItem('always_include', index)}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>

            {formData.always_include.length === 0 && (
              <p className="no-items">No elements added yet. Add elements that should always be included in your content.</p>
            )}

            {aiAssistEnabled && aiSuggestions && aiSuggestions.always_include && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Elements to Always Include:</strong>
                    </p>
                    <div className="tag-container">
                      {aiSuggestions.always_include.map((item: string, index: number) => (
                        <div key={index} className="tag suggestion-tag">
                          {item}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('always_include', aiSuggestions.always_include)}
                    >
                      Apply All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentSection === 'hashtag_strategy' && (
          <div className="form-section">
            <h3>Hashtag Strategy</h3>
            <p className="section-description">
              Define hashtags to include in your social media posts. These will be automatically added to your content.
            </p>

            <div className="tag-input-container">
              <div className="tag-input">
                <input
                  type="text"
                  value={newItem}
                  onChange={handleNewItemChange}
                  placeholder="Add a hashtag (without the # symbol)..."
                />
                <button
                  type="button"
                  onClick={() => addItem('hashtag_strategy')}
                  className="add-tag-button"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="tag-container">
              {formData.hashtag_strategy.map((item, index) => (
                <div key={index} className="tag hashtag">
                  #{item}
                  <span
                    className="tag-remove"
                    onClick={() => removeItem('hashtag_strategy', index)}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>

            {formData.hashtag_strategy.length === 0 && (
              <p className="no-items">No hashtags added yet. Add hashtags to include in your social media posts.</p>
            )}

            {aiAssistEnabled && aiSuggestions && aiSuggestions.hashtag_strategy && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Hashtags:</strong>
                    </p>
                    <div className="tag-container">
                      {aiSuggestions.hashtag_strategy.map((item: string, index: number) => (
                        <div key={index} className="tag hashtag suggestion-tag">
                          #{item}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('hashtag_strategy', aiSuggestions.hashtag_strategy)}
                    >
                      Apply All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentSection === 'content_guidelines' && (
          <div className="form-section">
            <h3>Content Guidelines</h3>
            <p className="section-description">
              Define general guidelines for your content, such as tone, style, or specific requirements.
            </p>

            <div className="form-group">
              <label htmlFor="content_guidelines">Content Guidelines</label>
              <textarea
                id="content_guidelines"
                name="content_guidelines"
                value={formData.content_guidelines}
                onChange={handleContentGuidelinesChange}
                placeholder="Enter general guidelines for your content..."
                rows={8}
              />
            </div>

            {aiAssistEnabled && aiSuggestions && aiSuggestions.content_guidelines && (
              <div className="ai-suggestions">
                <h3>AI Suggestions</h3>
                {isLoading ? (
                  <p>Loading suggestions...</p>
                ) : (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Content Guidelines:</strong>
                    </p>
                    <div className="suggestion-content">
                      {aiSuggestions.content_guidelines}
                    </div>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => setFormData({
                        ...formData,
                        content_guidelines: aiSuggestions.content_guidelines
                      })}
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

export default ContentGovernanceStep;
