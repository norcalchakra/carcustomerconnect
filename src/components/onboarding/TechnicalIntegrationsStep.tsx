import React, { useState, useEffect } from 'react';
import { TechnicalIntegration } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface TechnicalIntegrationsStepProps {
  integrations: TechnicalIntegration[];
  onSave: (integrations: TechnicalIntegration[]) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const TechnicalIntegrationsStep: React.FC<TechnicalIntegrationsStepProps> = ({
  integrations,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<TechnicalIntegration[]>([]);
  const [currentIntegration, setCurrentIntegration] = useState<TechnicalIntegration | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Integration types
  const integrationTypes = [
    'crm',
    'dms',
    'inventory',
    'website',
    'marketing',
    'analytics',
    'other'
  ];

  // Integration status options
  const statusOptions = [
    'active',
    'pending',
    'planned',
    'inactive'
  ];

  // Load existing integrations if available
  useEffect(() => {
    if (integrations && integrations.length > 0) {
      setFormData(integrations);
    }
  }, [integrations]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAiSuggestions = async () => {
      if (aiAssistEnabled && dealershipId) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAiSuggestions('technical_integrations', {
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

  const handleAddIntegration = () => {
    const newIntegration: TechnicalIntegration = {
      id: 0,
      dealership_id: dealershipId || 0,
      integration_type: 'crm',
      provider_name: '',
      api_key: '',
      endpoint_url: '',
      status: 'planned',
      configuration: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentIntegration(newIntegration);
    setIsEditing(true);
  };

  const handleEditIntegration = (integration: TechnicalIntegration) => {
    setCurrentIntegration({ ...integration });
    setIsEditing(true);
  };

  const handleDeleteIntegration = (integrationId: number) => {
    setFormData(prev => prev.filter(i => i.id !== integrationId));
  };

  const handleIntegrationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (currentIntegration) {
      setCurrentIntegration({
        ...currentIntegration,
        [name]: value
      });
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    if (currentIntegration) {
      setCurrentIntegration({
        ...currentIntegration,
        configuration: {
          ...currentIntegration.configuration,
          [key]: value
        }
      });
    }
  };

  const handleAddConfigField = () => {
    if (currentIntegration) {
      setCurrentIntegration({
        ...currentIntegration,
        configuration: {
          ...currentIntegration.configuration,
          [`field_${Object.keys(currentIntegration.configuration).length + 1}`]: ''
        }
      });
    }
  };

  const handleRemoveConfigField = (key: string) => {
    if (currentIntegration) {
      const newConfig = { ...currentIntegration.configuration };
      delete newConfig[key];
      
      setCurrentIntegration({
        ...currentIntegration,
        configuration: newConfig
      });
    }
  };

  const handleSaveIntegration = () => {
    if (!currentIntegration || !currentIntegration.provider_name) {
      setError('Provider name is required');
      return;
    }
    
    // Update or add the integration to the list
    const updatedIntegrations = [...formData];
    const existingIndex = updatedIntegrations.findIndex(i => i.id === currentIntegration.id);
    
    if (existingIndex >= 0) {
      updatedIntegrations[existingIndex] = {
        ...currentIntegration,
        updated_at: new Date().toISOString()
      };
    } else {
      updatedIntegrations.push({
        ...currentIntegration,
        updated_at: new Date().toISOString()
      });
    }
    
    setFormData(updatedIntegrations);
    setCurrentIntegration(null);
    setIsEditing(false);
    setError(null);
  };

  const handleCancelEdit = () => {
    setCurrentIntegration(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const applySuggestion = (suggestion: TechnicalIntegration) => {
    // Create a new integration with the suggestion
    const newIntegration: TechnicalIntegration = {
      id: 0,
      dealership_id: dealershipId || 0,
      integration_type: suggestion.integration_type,
      provider_name: suggestion.provider_name,
      api_key: '',
      endpoint_url: suggestion.endpoint_url || '',
      status: 'planned',
      configuration: suggestion.configuration || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setFormData([...formData, newIntegration]);
  };

  const getIntegrationTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'crm':
        return 'CRM System';
      case 'dms':
        return 'Dealer Management System';
      case 'inventory':
        return 'Inventory Management';
      case 'website':
        return 'Website Integration';
      case 'marketing':
        return 'Marketing Platform';
      case 'analytics':
        return 'Analytics Tool';
      case 'other':
        return 'Other Integration';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusDisplayName = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending Setup';
      case 'planned':
        return 'Planned';
      case 'inactive':
        return 'Inactive';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'planned':
        return 'status-planned';
      case 'inactive':
        return 'status-inactive';
      default:
        return '';
    }
  };

  // Group integrations by type
  const integrationsByType: Record<string, TechnicalIntegration[]> = {};
  integrationTypes.forEach(type => {
    integrationsByType[type] = formData.filter(i => i.integration_type === type);
  });

  if (isEditing && currentIntegration) {
    return (
      <div className="integration-editor">
        <h3>{currentIntegration.id ? 'Edit' : 'Add'} Technical Integration</h3>
        
        <div className="form-group">
          <label htmlFor="integration_type">Integration Type*</label>
          <select
            id="integration_type"
            name="integration_type"
            value={currentIntegration.integration_type}
            onChange={handleIntegrationChange}
            required
          >
            {integrationTypes.map(type => (
              <option key={type} value={type}>
                {getIntegrationTypeDisplayName(type)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="provider_name">Provider Name*</label>
          <input
            type="text"
            id="provider_name"
            name="provider_name"
            value={currentIntegration.provider_name}
            onChange={handleIntegrationChange}
            placeholder="e.g. Salesforce, CDK, Reynolds & Reynolds"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endpoint_url">API Endpoint URL</label>
          <input
            type="text"
            id="endpoint_url"
            name="endpoint_url"
            value={currentIntegration.endpoint_url}
            onChange={handleIntegrationChange}
            placeholder="https://api.example.com/v1/"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="api_key">API Key</label>
          <input
            type="password"
            id="api_key"
            name="api_key"
            value={currentIntegration.api_key}
            onChange={handleIntegrationChange}
            placeholder="Enter API key (stored securely)"
          />
          <p className="field-hint">
            API keys are stored securely and encrypted in our database.
          </p>
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={currentIntegration.status}
            onChange={handleIntegrationChange}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {getStatusDisplayName(status)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Additional Configuration</label>
          <div className="config-fields">
            {Object.entries(currentIntegration.configuration).map(([key, value]) => (
              <div key={key} className="config-field">
                <input
                  type="text"
                  value={key}
                  disabled
                  className="config-key"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                  className="config-value"
                  placeholder="Value"
                />
                <button
                  type="button"
                  className="remove-config-field"
                  onClick={() => handleRemoveConfigField(key)}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-config-field"
              onClick={handleAddConfigField}
            >
              Add Configuration Field
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancelEdit}>
            Cancel
          </button>
          <button type="button" className="save-button" onClick={handleSaveIntegration}>
            Save Integration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step technical-integrations-step">
      <h2>Technical Integrations</h2>
      <p className="step-description">
        Configure integrations with your existing systems to enable seamless data flow and automation.
      </p>

      <button
        type="button"
        className="add-button"
        onClick={handleAddIntegration}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Integration
      </button>

      <form onSubmit={handleSubmit}>
        {integrationTypes.map(type => {
          const typeIntegrations = integrationsByType[type] || [];
          
          if (typeIntegrations.length === 0) {
            return null;
          }
          
          return (
            <div key={type} className="form-section">
              <h3>{getIntegrationTypeDisplayName(type)}</h3>
              
              <div className="integration-cards">
                {typeIntegrations.map(integration => (
                  <div key={integration.id || `new-${integration.provider_name}`} className="integration-card">
                    <div className="integration-header">
                      <h4>{integration.provider_name}</h4>
                      <div className={`status-badge ${getStatusClass(integration.status)}`}>
                        {getStatusDisplayName(integration.status)}
                      </div>
                    </div>
                    
                    {integration.endpoint_url && (
                      <div className="integration-detail">
                        <strong>Endpoint:</strong> {integration.endpoint_url}
                      </div>
                    )}
                    
                    {integration.api_key && (
                      <div className="integration-detail">
                        <strong>API Key:</strong> ••••••••••••
                      </div>
                    )}
                    
                    {Object.keys(integration.configuration).length > 0 && (
                      <div className="integration-config">
                        <strong>Configuration:</strong>
                        <ul>
                          {Object.entries(integration.configuration).map(([key, value]) => (
                            <li key={key}>
                              <span className="config-key">{key}:</span> {value as string}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="integration-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => handleEditIntegration(integration)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteIntegration(integration.id)}
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
          <div className="no-integrations">
            <p>No integrations added yet. Click the "Add Integration" button to get started.</p>
          </div>
        )}

        {aiAssistEnabled && aiSuggestions && (
          <div className="ai-suggestions">
            <h3>AI Suggestions</h3>
            {isLoading ? (
              <p>Loading suggestions...</p>
            ) : (
              <>
                {aiSuggestions.integrations && aiSuggestions.integrations.length > 0 && (
                  <div className="suggestion-grid">
                    {aiSuggestions.integrations.map((suggestion: any, index: number) => (
                      <div key={index} className="suggestion-item integration-suggestion">
                        <h4>{suggestion.provider_name}</h4>
                        <div className="suggestion-type">
                          {getIntegrationTypeDisplayName(suggestion.integration_type)}
                        </div>
                        {suggestion.endpoint_url && (
                          <p className="suggestion-endpoint">
                            <strong>Endpoint:</strong> {suggestion.endpoint_url}
                          </p>
                        )}
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

export default TechnicalIntegrationsStep;
