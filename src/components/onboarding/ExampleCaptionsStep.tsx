import React, { useState, useEffect } from 'react';
import { ExampleCaption } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface ExampleCaptionsStepProps {
  captions: ExampleCaption[];
  onSave: (captions: ExampleCaption[]) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const ExampleCaptionsStep: React.FC<ExampleCaptionsStepProps> = ({
  captions,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<ExampleCaption[]>([]);
  const [currentCaption, setCurrentCaption] = useState<ExampleCaption | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Caption types
  const captionTypes = [
    'acquisition',
    'service_preparation',
    'ready_for_sale',
    'customer_delivery',
    'general'
  ];

  // Social platforms
  const platforms = [
    'facebook',
    'instagram',
    'google',
    'any'
  ];

  // Load existing captions if available
  useEffect(() => {
    if (captions && captions.length > 0) {
      setFormData(captions);
    }
  }, [captions]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAISuggestions({
            dealership_id: dealershipId,
            section: 'example_captions'
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

  const handleAddCaption = () => {
    const newCaption: ExampleCaption = {
      id: 0,
      dealership_id: dealershipId || 0,
      caption_type: 'general',
      platform: 'any',
      caption_text: '',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentCaption(newCaption);
    setIsEditing(true);
  };

  const handleEditCaption = (caption: ExampleCaption) => {
    setCurrentCaption({ ...caption });
    setIsEditing(true);
  };

  const handleDeleteCaption = (captionId: number) => {
    setFormData(prev => prev.filter(c => c.id !== captionId));
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (currentCaption) {
      setCurrentCaption({
        ...currentCaption,
        [name]: value
      });
    }
  };

  const handleSaveCaption = () => {
    if (!currentCaption || !currentCaption.caption_text) {
      setError('Caption text is required');
      return;
    }
    
    // Update or add the caption to the list
    const updatedCaptions = [...formData];
    const existingIndex = updatedCaptions.findIndex(c => c.id === currentCaption.id);
    
    if (existingIndex >= 0) {
      updatedCaptions[existingIndex] = {
        ...currentCaption,
        updated_at: new Date().toISOString()
      };
    } else {
      updatedCaptions.push({
        ...currentCaption,
        updated_at: new Date().toISOString()
      });
    }
    
    setFormData(updatedCaptions);
    setCurrentCaption(null);
    setIsEditing(false);
    setError(null);
  };

  const handleCancelEdit = () => {
    setCurrentCaption(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.length === 0) {
      setError('Please add at least one example caption');
      return;
    }
    
    onSave(formData);
  };

  const applySuggestion = (suggestion: ExampleCaption) => {
    // Create a new caption with the suggestion
    const newCaption: ExampleCaption = {
      id: 0,
      dealership_id: dealershipId || 0,
      caption_type: suggestion.caption_type,
      platform: suggestion.platform,
      caption_text: suggestion.caption_text,
      notes: suggestion.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setFormData([...formData, newCaption]);
  };

  const getCaptionTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'acquisition':
        return 'Vehicle Acquisition';
      case 'service_preparation':
        return 'Service & Preparation';
      case 'ready_for_sale':
        return 'Ready for Sale';
      case 'customer_delivery':
        return 'Customer Delivery';
      case 'general':
        return 'General';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getPlatformDisplayName = (platform: string): string => {
    switch (platform) {
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'google':
        return 'Google Business';
      case 'any':
        return 'Any Platform';
      default:
        return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  const getPlatformIcon = (platform: string): string => {
    switch (platform) {
      case 'facebook':
        return 'facebook';
      case 'instagram':
        return 'instagram';
      case 'google':
        return 'google';
      case 'any':
        return 'globe';
      default:
        return 'globe';
    }
  };

  // Group captions by type
  const captionsByType: Record<string, ExampleCaption[]> = {};
  captionTypes.forEach(type => {
    captionsByType[type] = formData.filter(c => c.caption_type === type);
  });

  if (isEditing && currentCaption) {
    return (
      <div className="caption-editor">
        <h3>{currentCaption.id ? 'Edit' : 'Add'} Example Caption</h3>
        
        <div className="form-group">
          <label htmlFor="caption_type">Caption Type*</label>
          <select
            id="caption_type"
            name="caption_type"
            value={currentCaption.caption_type}
            onChange={handleCaptionChange}
            required
          >
            {captionTypes.map(type => (
              <option key={type} value={type}>
                {getCaptionTypeDisplayName(type)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="platform">Platform*</label>
          <select
            id="platform"
            name="platform"
            value={currentCaption.platform}
            onChange={handleCaptionChange}
            required
          >
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {getPlatformDisplayName(platform)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="caption_text">Caption Text*</label>
          <textarea
            id="caption_text"
            name="caption_text"
            value={currentCaption.caption_text}
            onChange={handleCaptionChange}
            placeholder="Write your example caption here..."
            rows={6}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={currentCaption.notes}
            onChange={handleCaptionChange}
            placeholder="Add any notes about when to use this caption style..."
            rows={3}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancelEdit}>
            Cancel
          </button>
          <button type="button" className="save-button" onClick={handleSaveCaption}>
            Save Caption
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step example-captions-step">
      <h2>Example Captions</h2>
      <p className="step-description">
        Add example captions that represent your dealership's voice and style. These will be used as references for AI-generated content.
      </p>

      <button
        type="button"
        className="add-button"
        onClick={handleAddCaption}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Example Caption
      </button>

      <form onSubmit={handleSubmit}>
        {captionTypes.map(type => {
          const typeCaptions = captionsByType[type] || [];
          
          if (typeCaptions.length === 0) {
            return null;
          }
          
          return (
            <div key={type} className="form-section">
              <h3>{getCaptionTypeDisplayName(type)}</h3>
              
              <div className="caption-cards">
                {typeCaptions.map(caption => (
                  <div key={caption.id || `new-${caption.caption_text.substring(0, 10)}`} className="caption-card">
                    <div className="caption-header">
                      <div className="platform-badge">
                        <i className={`fa fa-${getPlatformIcon(caption.platform)}`}></i>
                        {getPlatformDisplayName(caption.platform)}
                      </div>
                    </div>
                    
                    <div className="caption-content">
                      <p>{caption.caption_text}</p>
                    </div>
                    
                    {caption.notes && (
                      <div className="caption-notes">
                        <strong>Notes:</strong> {caption.notes}
                      </div>
                    )}
                    
                    <div className="caption-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => handleEditCaption(caption)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteCaption(caption.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {formData.length === 0 && (
          <div className="no-captions">
            <p>No example captions added yet. Click the "Add Example Caption" button to get started.</p>
          </div>
        )}

        {aiAssistEnabled && aiSuggestions && (
          <div className="ai-suggestions">
            <h3>AI Suggestions</h3>
            {isLoading ? (
              <p>Loading suggestions...</p>
            ) : (
              <>
                {aiSuggestions.captions && aiSuggestions.captions.length > 0 && (
                  <div className="suggestion-grid">
                    {aiSuggestions.captions.map((suggestion: ExampleCaption, index: number) => (
                      <div key={index} className="suggestion-item caption-suggestion">
                        <div className="suggestion-header">
                          <span className="caption-type-tag">
                            {getCaptionTypeDisplayName(suggestion.caption_type)}
                          </span>
                          <span className="platform-tag">
                            {getPlatformDisplayName(suggestion.platform)}
                          </span>
                        </div>
                        <p className="suggestion-caption">{suggestion.caption_text}</p>
                        <button
                          type="button"
                          className="apply-suggestion"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          Add This
                        </button>
                      </div>
                    ))}
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

export default ExampleCaptionsStep;
