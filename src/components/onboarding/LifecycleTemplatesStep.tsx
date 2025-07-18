import React, { useState, useEffect } from 'react';
import { LifecycleTemplate } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

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
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lifecycle stages
  const lifecycleStages = [
    'acquisition',
    'service_preparation',
    'ready_for_sale',
    'customer_delivery'
  ];

  // Load existing templates if available
  useEffect(() => {
    if (templates && templates.length > 0) {
      setLifecycleTemplates(templates);
    } else {
      // Initialize with empty templates for each stage
      const initialTemplates = lifecycleStages.map(stage => ({
        id: 0,
        dealership_id: dealershipId || 0,
        stage_name: stage,
        template_name: '',
        template_content: '',
        variables: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setLifecycleTemplates(initialTemplates);
    }
  }, [templates, dealershipId, lifecycleStages]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId && currentTemplate) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAiSuggestions('lifecycle_template', {
            dealershipId,
            stageName: currentTemplate.stage_name
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

    if (currentTemplate) {
      getAiSuggestions();
    }
  }, [aiAssistEnabled, dealershipId, currentTemplate]);

  // Helper to get stage display name
  const getStageDisplayName = (stageName: string): string => {
    switch (stageName) {
      case 'acquisition':
        return 'Vehicle Acquisition';
      case 'service_preparation':
        return 'Service & Preparation';
      case 'ready_for_sale':
        return 'Ready for Sale';
      case 'customer_delivery':
        return 'Customer Delivery';
      default:
        return stageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleAddTemplate = (stageName: string) => {
    const newTemplate: LifecycleTemplate = {
      id: 0,
      dealership_id: dealershipId || 0,
      stage_name: stageName,
      template_name: '',
      template_content: '',
      variables: [],
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

  const handleVariablesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        variables: value.split('\n').filter(v => v.trim() !== '')
      });
    }
  };

  const handleSaveTemplate = () => {
    if (!currentTemplate || !currentTemplate.template_name || !currentTemplate.template_content) {
      setError('Template name and content are required');
      return;
    }
    
    // Update or add the template to the list
    const updatedTemplates = [...lifecycleTemplates];
    const existingIndex = updatedTemplates.findIndex(t => 
      t.id === currentTemplate.id || 
      (t.id === 0 && t.stage_name === currentTemplate.stage_name && t.template_name === '')
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
    
    onSave(validTemplates);
  };

  // Group templates by stage
  const templatesByStage: Record<string, LifecycleTemplate[]> = {};
  lifecycleStages.forEach(stage => {
    templatesByStage[stage] = lifecycleTemplates.filter(t => t.stage_name === stage && t.template_name);
  });

  if (isEditing && currentTemplate) {
    return (
      <div className="template-editor">
        <h3>{getStageDisplayName(currentTemplate.stage_name)} Template</h3>
        
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
          <textarea
            id="template_content"
            name="template_content"
            value={currentTemplate.template_content}
            onChange={handleTemplateChange}
            placeholder="Write your template content here. Use {variable_name} for dynamic content."
            rows={8}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="variables">Variables (one per line)</label>
          <textarea
            id="variables"
            name="variables"
            value={currentTemplate.variables.join('\n')}
            onChange={handleVariablesChange}
            placeholder="e.g. vehicle_make&#10;vehicle_model&#10;price"
            rows={4}
          />
          <p className="field-hint">
            These are the variables that can be used in your template with {'{variable_name}'} syntax.
          </p>
        </div>
        
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
                
                {aiSuggestions.variables && currentTemplate.variables.length === 0 && (
                  <div className="suggestion-item">
                    <p>
                      <strong>Suggested Variables:</strong> {aiSuggestions.variables.join(', ')}
                    </p>
                    <button
                      type="button"
                      className="apply-suggestion"
                      onClick={() => applySuggestion('variables', aiSuggestions.variables)}
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
        {lifecycleStages.map(stage => (
          <div key={stage} className="form-section">
            <h3>{getStageDisplayName(stage)}</h3>
            
            {templatesByStage[stage] && templatesByStage[stage].length > 0 ? (
              templatesByStage[stage].map(template => (
                <div key={`${template.stage_name}-${template.template_name}`} className="template-card">
                  <h4>{template.template_name}</h4>
                  <p>{template.template_content}</p>
                  
                  {template.variables.length > 0 && (
                    <div className="template-variables">
                      <strong>Variables:</strong>
                      <div className="tag-container">
                        {template.variables.map((variable, index) => (
                          <span key={index} className="tag">{variable}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
                      onClick={() => handleDeleteTemplate(template.id)}
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
