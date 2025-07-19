import React, { useState, useEffect } from 'react';
import { LifecycleTemplate, DealershipProfile, BrandVoiceSettings } from '../../lib/dealerOnboardingTypes';
import { dealerOnboardingApi } from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

// Define the expected structure for AI suggestions
interface AISuggestionResponse {
  template_content?: string;
  variables?: string[];
  [key: string]: any;
}

// Define lifecycle stages outside the component to prevent recreation on each render
const LIFECYCLE_STAGES: Array<'acquisition' | 'service' | 'ready_for_sale' | 'delivery'> = [
  'acquisition',
  'service',
  'ready_for_sale',
  'delivery'
];

interface LifecycleTemplatesStepProps {
  templates: LifecycleTemplate[];
  onSave: (templates: LifecycleTemplate[]) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const LifecycleTemplatesStep: React.FC<LifecycleTemplatesStepProps> = ({
  templates,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [lifecycleTemplates, setLifecycleTemplates] = useState<LifecycleTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<LifecycleTemplate | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  // Success message state is used in the UI
  const [success, setSuccess] = useState<string>('');
  const [businessProfile, setBusinessProfile] = useState<DealershipProfile | null>(null);
  const [brandVoice, setBrandVoice] = useState<BrandVoiceSettings | null>(null);

  // Use the lifecycle stages defined outside the component

  // Load existing templates if available
  useEffect(() => {
    if (templates && templates.length > 0) {
      setLifecycleTemplates(templates);
    } else {
      // Initialize with empty templates for each stage
      const initialTemplates = LIFECYCLE_STAGES.map(stage => ({
        id: 0,
        dealership_id: dealershipId || 0,
        lifecycle_stage: stage,
        template_name: '',
        template_content: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setLifecycleTemplates(initialTemplates);
    }
  }, [templates, dealershipId]); // Removed lifecycleStages from dependencies

  // Fetch business profile and brand voice data when dealership ID changes
  useEffect(() => {
    if (!dealershipId) return;
    
    const fetchDealershipData = async () => {
      try {
        // Fetch business profile
        const profileData = await dealerOnboardingApi.getDealershipProfile(dealershipId);
        setBusinessProfile(profileData);
        
        // Fetch brand voice settings
        const voiceData = await dealerOnboardingApi.getBrandVoiceSettings(dealershipId);
        setBrandVoice(voiceData);
      } catch (err) {
        console.error('Error fetching dealership data:', err);
      }
    };
    
    // Call the function to fetch data
    fetchDealershipData();
  }, [dealershipId]);

  // Get AI suggestions if enabled
  useEffect(() => {
    // Skip if AI is disabled or missing required data
    if (!aiAssistEnabled || !dealershipId || !currentTemplate) {
      return;
    }
    
    const getAiSuggestions = async () => {
      setIsLoading(true);
      try {
        // Check if the API function is getAISuggestions (capital AI) instead of getAiSuggestions
        const suggestions = await dealerOnboardingApi.getAISuggestions({
          dealership_id: dealershipId,
          section: 'lifecycle_template',
          current_data: {
            lifecycle_stage: currentTemplate.lifecycle_stage
          }
        });
        setAiSuggestions(suggestions);
      } catch (err) {
        console.error('Error getting AI suggestions:', err);
        setError('Failed to get AI suggestions');
      } finally {
        setIsLoading(false);
      }
    };

    getAiSuggestions();
  }, [aiAssistEnabled, dealershipId, currentTemplate?.lifecycle_stage]); // Only depend on lifecycle_stage, not the entire object

  // Function to generate template content with AI using business profile and brand voice
  const generateTemplateWithAI = async () => {
    if (!currentTemplate || !dealershipId) return;
    
    setIsLoading(true);
    try {
      // Add a timestamp to ensure we get a fresh response each time
      const timestamp = new Date().getTime();
      
      // Log the metrics being used for AI generation
      console.log('--- AI TEMPLATE GENERATION METRICS ---');
      console.log('Lifecycle Stage:', currentTemplate.lifecycle_stage);
      console.log('Business Profile:', businessProfile);
      console.log('Brand Voice Settings:', brandVoice);
      
      // Create the prompt payload
      const promptPayload = {
        dealership_id: dealershipId,
        section: 'lifecycle_templates',
        current_data: {
          lifecycle_stage: currentTemplate.lifecycle_stage,
          business_profile: businessProfile,
          brand_voice: brandVoice,
          timestamp: timestamp // Add timestamp to force a new response
        }
      };
      
      // Log the prompt being sent to the API
      console.log('--- PROMPT SENT TO AI API ---');
      console.log(JSON.stringify(promptPayload, null, 2));
      
      const suggestions = await dealerOnboardingApi.getAISuggestions(promptPayload) as AISuggestionResponse;
      
      // Log the response from the API
      console.log('--- AI API RESPONSE ---');
      console.log(JSON.stringify(suggestions, null, 2));
      
      if (suggestions && suggestions.suggestions) {
        // Extract the template content based on the current lifecycle stage
        const lifecycleStage = currentTemplate.lifecycle_stage;
        let templateContent = suggestions.suggestions[lifecycleStage];
        
        if (typeof templateContent === 'string') {
          // The API now returns a template with specific vehicle details already included
          setCurrentTemplate(prev => ({
            ...prev!,
            template_content: templateContent
          }));
          
          // Clear any previous variables
          setTemplateVariables([]);
          
          // Show the explanation as a success message
          if (suggestions.explanation) {
            setSuccess(suggestions.explanation);
          }
        } else {
          console.error('No template content found for lifecycle stage:', lifecycleStage);
          setError(`No template content available for ${lifecycleStage} stage`);
        }
      }
      
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error('Error generating AI template:', err);
      setError('Failed to generate template with AI');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get stage display name
  const getStageDisplayName = (stageName: string): string => {
    switch (stageName) {
      case 'acquisition':
        return 'Vehicle Acquisition';
      case 'service':
        return 'Service & Preparation';
      case 'ready_for_sale':
        return 'Ready for Sale';
      case 'delivery':
        return 'Customer Delivery';
      default:
        return stageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleAddTemplate = (stageName: 'acquisition' | 'service' | 'ready_for_sale' | 'delivery') => {
    const newTemplate: LifecycleTemplate = {
      id: 0,
      dealership_id: dealershipId || 0,
      lifecycle_stage: stageName,
      template_name: '',
      template_content: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: LifecycleTemplate) => {
    setCurrentTemplate({ ...template });
    setIsEditing(true);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    // Get the lifecycle stage of the template being deleted
    const templateToDelete = lifecycleTemplates.find(t => t.id === templateId);
    const lifecycleStage = templateToDelete?.lifecycle_stage;
    
    // Only delete from Supabase if it's a real template (id > 0)
    if (templateId > 0) {
      try {
        console.log('Deleting template from Supabase, ID:', templateId);
        const success = await dealerOnboardingApi.deleteLifecycleTemplate(templateId);
        
        if (success) {
          console.log('Template deleted successfully from Supabase');
          setSuccess('Template deleted successfully');
          setTimeout(() => setSuccess(null), 3000);
          
          // Refresh templates for this lifecycle stage from the database
          if (lifecycleStage) {
            try {
              const freshTemplates = await dealerOnboardingApi.getLifecycleTemplates(Number(dealershipId));
              const stageTemplates = freshTemplates.filter(t => t.lifecycle_stage === lifecycleStage);
              console.log(`Refreshed templates for ${lifecycleStage} stage after deletion:`, stageTemplates);
              
              // Update only the templates for this stage
              const otherStageTemplates = lifecycleTemplates.filter(t => t.lifecycle_stage !== lifecycleStage);
              setLifecycleTemplates([...otherStageTemplates, ...stageTemplates]);
              return; // We've already updated the state, so return early
            } catch (refreshErr) {
              console.error('Error refreshing templates after deletion:', refreshErr);
              // Fall through to the default state update below
            }
          }
        } else {
          console.error('Failed to delete template from Supabase');
          setError('Failed to delete template from database');
          return; // Don't update UI if database delete failed
        }
      } catch (err) {
        console.error('Error deleting template:', err);
        setError('Error deleting template from database');
        return; // Don't update UI if database delete failed
      }
    }
    
    // Update local state if we didn't refresh from database
    setLifecycleTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        [name]: value
      });
    }
  };

  // Variables state kept for API compatibility but no longer displayed in UI
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);

  const handleSaveTemplate = async () => {
    if (!currentTemplate || !currentTemplate.template_name || !currentTemplate.template_content) {
      setError('Template name and content are required');
      return;
    }
    
    // Ensure dealership_id is set and is a number
    const templateToSave = {
      ...currentTemplate,
      dealership_id: Number(dealershipId) || 0,
      updated_at: new Date().toISOString()
    };
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Save directly to Supabase
      console.log('Saving template directly to Supabase:', templateToSave);
      console.log('Template lifecycle stage:', templateToSave.lifecycle_stage);
      
      const savedTemplate = await dealerOnboardingApi.saveLifecycleTemplate(templateToSave);
      
      if (savedTemplate) {
        console.log('Template saved successfully to Supabase:', savedTemplate);
        
        // Update the local state with the saved template
        const updatedTemplates = [...lifecycleTemplates];
        const existingIndex = updatedTemplates.findIndex(t => 
          (t.id === templateToSave.id && t.id !== 0) || 
          (t.id === 0 && t.lifecycle_stage === templateToSave.lifecycle_stage && t.template_name === '')
        );
        
        if (existingIndex >= 0) {
          updatedTemplates[existingIndex] = savedTemplate;
        } else {
          updatedTemplates.push(savedTemplate);
        }
        
        setLifecycleTemplates(updatedTemplates);
        setSuccess('Template saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        
        // Refresh templates for this lifecycle stage from the database
        try {
          const freshTemplates = await dealerOnboardingApi.getLifecycleTemplates(Number(dealershipId));
          const stageTemplates = freshTemplates.filter(t => t.lifecycle_stage === templateToSave.lifecycle_stage);
          console.log(`Refreshed templates for ${templateToSave.lifecycle_stage} stage:`, stageTemplates);
          
          // Update only the templates for this stage
          const otherStageTemplates = lifecycleTemplates.filter(t => t.lifecycle_stage !== templateToSave.lifecycle_stage);
          setLifecycleTemplates([...otherStageTemplates, ...stageTemplates]);
        } catch (refreshErr) {
          console.error('Error refreshing templates:', refreshErr);
          // Continue with the local state update even if refresh fails
        }
      } else {
        setError('Failed to save template to database');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Error saving template to database');
    } finally {
      setIsLoading(false);
      setCurrentTemplate(null);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setCurrentTemplate(null);
    setIsEditing(false);
    setError(null);
  };

  const applySuggestion = (field: string, value: any) => {
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        [field]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty templates
    const validTemplates = lifecycleTemplates.filter(
      template => template.template_name && template.template_content
    );
    
    if (validTemplates.length === 0) {
      setError('Please create at least one template');
      return;
    }
    
    // Since we're already saving templates individually when they're created or edited,
    // we just need to pass the current state of templates to the parent component
    // to update its state and move to the next step
    console.log('Moving to next step with templates:', validTemplates);
    
    // Group templates by lifecycle stage for better visibility in logs
    const templatesByStage: Record<string, LifecycleTemplate[]> = {};
    LIFECYCLE_STAGES.forEach(stage => {
      templatesByStage[stage] = validTemplates.filter(t => t.lifecycle_stage === stage);
    });
    console.log('Templates by stage when moving to next step:', templatesByStage);
    
    // Call the parent's onSave function to update state and move to next step
    // This won't re-save templates to Supabase since we're already doing that individually
    onSave(validTemplates);
  };

  // Group templates by stage
  const templatesByStage: Record<string, LifecycleTemplate[]> = {};
  LIFECYCLE_STAGES.forEach(stage => {
    templatesByStage[stage] = lifecycleTemplates.filter(t => t.lifecycle_stage === stage && t.template_name);
  });

  if (isEditing && currentTemplate) {
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-md">
          <div className="modal-header">
            <h3>{getStageDisplayName(currentTemplate.lifecycle_stage)} Template</h3>
            <button
              onClick={handleCancelEdit}
              className="modal-close"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="template_name">Template Name*</label>
              <input
                type="text"
                id="template_name"
                name="template_name"
                value={currentTemplate.template_name}
                onChange={handleTemplateChange}
                placeholder="e.g. Standard Acquisition, Luxury Vehicle, etc."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="template_content">Template Content*</label>
              <div className="template-content-header">
                {aiAssistEnabled && (
                  <button 
                    type="button" 
                    className="ai-button" 
                    onClick={generateTemplateWithAI}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span>Generating...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 8v8"></path>
                          <path d="M8 12h8"></path>
                        </svg>
                        Generate with AI
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                id="template-content"
                name="template_content"
                value={currentTemplate.template_content}
                onChange={handleTemplateChange}
                placeholder="Write your template content here or click 'Generate with AI' to create content based on your business profile and brand voice."
                rows={8}
                required
              />
            </div>
            
            {/* Variables section removed as requested */}
            
            {aiAssistEnabled && aiSuggestions && (
              <div className="ai-suggestion-container">
                <div className="ai-suggestion-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  <h4>AI Suggestions</h4>
                </div>
                
                {isLoading ? (
                  <p className="ai-loading">Loading suggestions...</p>
                ) : (
                  <>
                    {aiSuggestions?.template_content && !currentTemplate.template_content && (
                      <div className="ai-suggestion-item">
                        <p>
                          <strong>Suggested Template Content:</strong>
                        </p>
                        <div className="ai-suggestion-content">
                          {aiSuggestions.template_content}
                        </div>
                        <button
                          type="button"
                          className="apply-button"
                          onClick={() => applySuggestion('template_content', aiSuggestions.template_content)}
                        >
                          Apply Suggestion
                        </button>
                      </div>
                    )}
                    
                    {aiSuggestions?.variables && templateVariables.length === 0 && (
                      <div className="ai-suggestion-item">
                        <p>
                          <strong>Suggested Variables:</strong> {aiSuggestions.variables.join(', ')}
                        </p>
                        <button
                          type="button"
                          className="apply-button"
                          onClick={() => aiSuggestions.variables && setTemplateVariables(aiSuggestions.variables)}
                        >
                          Apply Suggestion
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button type="button" className="cancel-button" onClick={handleCancelEdit}>
            Cancel
          </button>
          <button type="button" className="save-button" onClick={handleSaveTemplate}>
            Save Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step lifecycle-templates-step">
      <h2>Lifecycle Stage Templates</h2>
      <p className="step-description">
        Create templates for different stages of the vehicle lifecycle. These templates will be used to generate content for social media posts and other communications.
      </p>
      
      <form onSubmit={handleSubmit}>
        {LIFECYCLE_STAGES.map(stage => (
          <div key={stage} className="template-stage-section">
            <h3>{getStageDisplayName(stage)}</h3>
            
            {templatesByStage[stage] && templatesByStage[stage].length > 0 ? (
              <div className="template-grid">
                {templatesByStage[stage].map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-card-header">
                      <h4>{template.template_name}</h4>
                      <div className="template-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditTemplate(template)}
                          aria-label="Edit template"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDeleteTemplate(template.id || 0)}
                          aria-label="Delete template"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="template-content-preview">
                      {template.template_content.length > 100
                        ? `${template.template_content.substring(0, 100)}...`
                        : template.template_content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-templates">No templates for this stage yet.</p>
            )}
            
            <button
              type="button"
              className="add-button"
              onClick={() => handleAddTemplate(stage)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Add {getStageDisplayName(stage)} Template
            </button>
          </div>
        ))}
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-actions">
          <button type="submit" className="primary-button">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default LifecycleTemplatesStep;
