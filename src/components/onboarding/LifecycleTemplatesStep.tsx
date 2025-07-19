import React, { useState, useEffect } from 'react';
import { LifecycleTemplate, DealershipProfile, BrandVoiceSettings } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const handleDeleteTemplate = (templateId: number) => {
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

  const handleSaveTemplate = () => {
    if (!currentTemplate || !currentTemplate.template_name || !currentTemplate.template_content) {
      setError('Template name and content are required');
      return;
    }
    
    // Update or add the template to the list
    const updatedTemplates = [...lifecycleTemplates];
    const existingIndex = updatedTemplates.findIndex(t => 
      t.id === currentTemplate.id || 
      (t.id === 0 && t.lifecycle_stage === currentTemplate.lifecycle_stage && t.template_name === '')
    );
    
    if (existingIndex >= 0) {
      updatedTemplates[existingIndex] = {
        ...currentTemplate,
        updated_at: new Date().toISOString()
      };
    } else {
      updatedTemplates.push({
        ...currentTemplate,
        updated_at: new Date().toISOString()
      });
    }
    
    setLifecycleTemplates(updatedTemplates);
    setCurrentTemplate(null);
    setIsEditing(false);
    setError(null);
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
    
    // Log what templates are being saved
    console.log('Saving templates:', validTemplates);
    
    // Group templates by lifecycle stage for better visibility
    const templatesByStageForSaving: Record<string, LifecycleTemplate[]> = {};
    LIFECYCLE_STAGES.forEach(stage => {
      templatesByStageForSaving[stage] = validTemplates.filter(t => t.lifecycle_stage === stage);
    });
    console.log('Templates by stage being saved:', templatesByStageForSaving);
    
    onSave(validTemplates);
  };

  // Group templates by stage
  const templatesByStage: Record<string, LifecycleTemplate[]> = {};
  LIFECYCLE_STAGES.forEach(stage => {
    templatesByStage[stage] = lifecycleTemplates.filter(t => t.lifecycle_stage === stage && t.template_name);
  });

  if (isEditing && currentTemplate) {
    return (
      <div className="template-editor">
        <h3>{getStageDisplayName(currentTemplate.lifecycle_stage)} Template</h3>
        
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
                className="generate-ai-button" 
                onClick={generateTemplateWithAI}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate with AI'}
              </button>
            )}
          </div>
          <textarea
            id="template_content"
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
          <div className="ai-suggestions">
            <h3>AI Suggestions</h3>
            {isLoading ? (
              <p>Loading suggestions...</p>
            ) : (
              <>
                {aiSuggestions.template_content && !currentTemplate.template_content && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Template Content:</strong>
                    </p>
                    <div className="suggestion-content">
                      {aiSuggestions.template_content}
                    </div>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('template_content', aiSuggestions.template_content)}
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                {aiSuggestions.variables && templateVariables.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Variables:</strong> {aiSuggestions.variables.join(', ')}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => aiSuggestions.variables && setTemplateVariables(aiSuggestions.variables)}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <div className="step-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
        
        <div className="form-actions">
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
          <div key={stage} className="form-section">
            <h3>{getStageDisplayName(stage)}</h3>
            
            {templatesByStage[stage] && templatesByStage[stage].length > 0 ? (
              templatesByStage[stage].map(template => (
                <div key={`${template.lifecycle_stage}-${template.template_name}`} className="template-card">
                  <h4>{template.template_name}</h4>
                  <p>{template.template_content}</p>
                  
                  {/* Variables would be displayed here if they were part of the template */}
                  
                  <div className="template-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEditTemplate(template)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteTemplate(template.id || 0)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-templates">No templates created for this stage yet.</p>
            )}
            
            <button
              type="button"
              className="add-button"
              onClick={() => handleAddTemplate(stage)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add {getStageDisplayName(stage)} Template
            </button>
          </div>
        ))}

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

export default LifecycleTemplatesStep;
