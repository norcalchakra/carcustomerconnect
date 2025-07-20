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
          setTimeout(() => setSuccess(''), 3000);
          
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
        setTimeout(() => setSuccess(''), 3000);
        
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
    setError('');
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
      <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
        <div className="modal-content modal-md" style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 500, color: '#334155' }}>{getStageDisplayName(currentTemplate.lifecycle_stage)} Template</h3>
            <button
              onClick={handleCancelEdit}
              className="modal-close"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="template_name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Template Name*</label>
              <input
                type="text"
                id="template_name"
                name="template_name"
                value={currentTemplate.template_name}
                onChange={handleTemplateChange}
                placeholder="e.g. Standard Acquisition, Luxury Vehicle, etc."
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem', fontSize: '0.875rem' }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="template_content" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Template Content*</label>
              <div className="template-content-header" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                {aiAssistEnabled && (
                  <button 
                    type="button" 
                    className="ai-button" 
                    onClick={generateTemplateWithAI}
                    disabled={isLoading}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      backgroundColor: '#f8fafc', 
                      color: '#64748b', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 500, 
                      cursor: 'pointer' 
                    }}
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
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem', fontSize: '0.875rem', minHeight: '150px' }}
              />
            </div>
            
            {/* Variables section removed as requested */}
            
            {aiAssistEnabled && aiSuggestions && currentTemplate.lifecycle_stage !== 'acquisition' && (
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
          
          <div className="modal-footer" style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="cancel-button" 
              onClick={handleCancelEdit}
              style={{ 
                backgroundColor: '#f8fafc', 
                color: '#64748b', 
                border: '1px solid #e2e8f0', 
                padding: '0.625rem 1rem', 
                borderRadius: '0.25rem', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="save-button" 
              onClick={handleSaveTemplate}
              style={{ 
                backgroundColor: '#0ea5e9', 
                color: 'white', 
                border: 'none', 
                padding: '0.625rem 1rem', 
                borderRadius: '0.25rem', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                cursor: 'pointer' 
              }}
            >
              Save Template
            </button>
          </div>
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
              <div className="lifecycle-templates-grid">
                {templatesByStage[stage].map(template => (
                  <div key={template.id} className="template-card" style={{ backgroundColor: '#f8fafc', borderRadius: '0.25rem', padding: '1rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {template.template_name}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleEditTemplate(template)}
                          style={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            color: '#64748b', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            cursor: 'pointer'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template.id || 0)}
                          style={{ 
                            backgroundColor: '#fef2f2', 
                            border: '1px solid #fee2e2', 
                            color: '#ef4444', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            cursor: 'pointer'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      {template.template_content.length > 120
                        ? `${template.template_content.substring(0, 120)}...`
                        : template.template_content}
                    </p>
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
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                backgroundColor: '#f8fafc', 
                color: '#64748b', 
                border: '1px solid #e2e8f0', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '0.25rem', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                cursor: 'pointer',
                marginTop: '0.75rem'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Add New {getStageDisplayName(stage)} Template
            </button>
          </div>
        ))}
        
        {error && <div style={{ color: '#ef4444', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.25rem', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: '#10b981', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.25rem', marginBottom: '1rem' }}>{success}</div>}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button 
            type="submit" 
            style={{ 
              backgroundColor: '#0ea5e9', 
              color: 'white', 
              border: 'none', 
              padding: '0.625rem 1.25rem', 
              borderRadius: '0.25rem', 
              fontSize: '0.875rem', 
              fontWeight: 500, 
              cursor: 'pointer' 
            }}
          >
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default LifecycleTemplatesStep;
