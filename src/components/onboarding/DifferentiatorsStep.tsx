import React, { useState, useEffect } from 'react';
import { CompetitiveDifferentiator } from '../../lib/dealerOnboardingTypes';
import dealerOnboardingApi from '../../lib/dealerOnboardingApi';
import './OnboardingSteps.css';

interface DifferentiatorsStepProps {
  differentiators: CompetitiveDifferentiator[];
  onSave: (differentiators: CompetitiveDifferentiator[]) => void;
  aiAssistEnabled: boolean;
  dealershipId: number | null;
}

const DifferentiatorsStep: React.FC<DifferentiatorsStepProps> = ({
  differentiators,
  onSave,
  aiAssistEnabled,
  dealershipId
}) => {
  const [formData, setFormData] = useState<CompetitiveDifferentiator[]>([]);
  const [currentDifferentiator, setCurrentDifferentiator] = useState<CompetitiveDifferentiator | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Differentiator categories
  const categories = [
    'service',
    'customer_experience',
    'financial',
    'inventory',
    'warranty',
    'community',
    'other'
  ];

  // Load existing differentiators if available
  useEffect(() => {
    if (differentiators && differentiators.length > 0) {
      setFormData(differentiators);
    }
  }, [differentiators]);

  // Get AI suggestions if enabled
  useEffect(() => {
    const getAISuggestionsData = async () => {
      if (aiAssistEnabled && dealershipId) {
        setIsLoading(true);
        try {
          const suggestions = await dealerOnboardingApi.getAISuggestions({
            dealership_id: dealershipId,
            section: 'differentiators'
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

    getAISuggestionsData();
  }, [aiAssistEnabled, dealershipId]);

  const handleAddDifferentiator = () => {
    const newDifferentiator: CompetitiveDifferentiator = {
      id: 0,
      dealership_id: dealershipId || 0,
      category: 'service',
      title: '',
      description: '',
      priority: formData.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentDifferentiator(newDifferentiator);
    setIsEditing(true);
  };

  const handleEditDifferentiator = (differentiator: CompetitiveDifferentiator) => {
    setCurrentDifferentiator({ ...differentiator });
    setIsEditing(true);
  };

  const handleDeleteDifferentiator = async (differentiatorId: number) => {
    try {
      setIsLoading(true);
      
      // Only attempt to delete from database if it's a real ID (not a temporary one)
      if (differentiatorId > 0) {
        console.log('Deleting differentiator from database:', differentiatorId);
        const success = await dealerOnboardingApi.deleteCompetitiveDifferentiator(differentiatorId);
        
        if (!success) {
          throw new Error('Failed to delete differentiator');
        }
        
        console.log('Differentiator deleted successfully from database');
      }
      
      // Update local state
      setFormData(prev => prev.filter(d => d.id !== differentiatorId));
    } catch (err) {
      console.error('Error deleting differentiator:', err);
      setError('Failed to delete differentiator. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifferentiatorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (currentDifferentiator) {
      setCurrentDifferentiator({
        ...currentDifferentiator,
        [name]: value
      });
    }
  };

  const handleSaveDifferentiator = async () => {
    if (!currentDifferentiator || !currentDifferentiator.title || !currentDifferentiator.description) {
      setError('Title and description are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Save the differentiator to the database immediately
      const differentiatorToSave = {
        ...currentDifferentiator,
        dealership_id: dealershipId || 0,
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving differentiator to database:', differentiatorToSave);
      const savedDifferentiator = await dealerOnboardingApi.saveCompetitiveDifferentiator(differentiatorToSave);
      
      if (!savedDifferentiator) {
        throw new Error('Failed to save differentiator');
      }
      
      console.log('Differentiator saved successfully:', savedDifferentiator);
      
      // Update the local state with the saved differentiator
      const updatedDifferentiators = [...formData];
      const existingIndex = updatedDifferentiators.findIndex(d => d.id === savedDifferentiator.id);
      
      if (existingIndex >= 0) {
        updatedDifferentiators[existingIndex] = savedDifferentiator;
      } else {
        updatedDifferentiators.push(savedDifferentiator);
      }
      
      setFormData(updatedDifferentiators);
      setCurrentDifferentiator(null);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error saving differentiator:', err);
      setError('Failed to save differentiator. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setCurrentDifferentiator(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.length === 0) {
      setError('Please add at least one differentiator');
      return;
    }
    
    onSave(formData);
  };

  const applySuggestion = (suggestion: any) => {
    if (currentDifferentiator) {
      setCurrentDifferentiator({
        ...currentDifferentiator,
        title: suggestion.title,
        description: suggestion.description
      });
    } else {
      // Create a new differentiator with the suggestion
      const newDifferentiator: CompetitiveDifferentiator = {
        id: 0,
        dealership_id: dealershipId || 0,
        category: suggestion.category || 'service',
        title: suggestion.title,
        description: suggestion.description,
        priority: formData.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setFormData([...formData, newDifferentiator]);
    }
  };

  const getCategoryDisplayName = (category: string): string => {
    switch (category) {
      case 'service':
        return 'Service';
      case 'customer_experience':
        return 'Customer Experience';
      case 'financial':
        return 'Financial Options';
      case 'inventory':
        return 'Inventory Selection';
      case 'warranty':
        return 'Warranty & Protection';
      case 'community':
        return 'Community Involvement';
      case 'other':
        return 'Other';
      default:
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Group differentiators by category
  const differentiatorsByCategory: Record<string, CompetitiveDifferentiator[]> = {};
  categories.forEach(category => {
    differentiatorsByCategory[category] = formData.filter(d => d.category === category);
  });

  if (isEditing && currentDifferentiator) {
    return (
      <div className="differentiator-editor">
        <h3>{currentDifferentiator.id ? 'Edit' : 'Add'} Differentiator</h3>
        
        <div className="form-group">
          <label htmlFor="category">Category*</label>
          <select
            id="category"
            name="category"
            value={currentDifferentiator.category}
            onChange={handleDifferentiatorChange}
            required
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryDisplayName(category)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="title">Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={currentDifferentiator.title}
            onChange={handleDifferentiatorChange}
            placeholder="e.g. Award-Winning Service Department"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description*</label>
          <textarea
            id="description"
            name="description"
            value={currentDifferentiator.description}
            onChange={handleDifferentiatorChange}
            placeholder="Describe what makes this a differentiator for your dealership..."
            rows={4}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Priority (1-10)</label>
          <div className="slider-container">
            <input
              type="range"
              id="priority"
              name="priority"
              value={currentDifferentiator.priority}
              onChange={handleDifferentiatorChange}
              min="1"
              max="10"
              step="1"
              className="priority-slider"
            />
            <div className="slider-value">{currentDifferentiator.priority}</div>
          </div>
          <p className="field-hint">
            Lower numbers will be featured more prominently in content.
          </p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancelEdit}>
            Cancel
          </button>
          <button type="button" className="save-button" onClick={handleSaveDifferentiator}>
            Save Differentiator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step differentiators-step">
      <h2>Competitive Differentiators</h2>
      <p className="step-description">
        What makes your dealership stand out from the competition? These differentiators will be highlighted in your AI-generated content.
      </p>

      <button
        type="button"
        className="add-button"
        onClick={handleAddDifferentiator}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Differentiator
      </button>

      <form onSubmit={handleSubmit}>
        {categories.map(category => {
          const categoryDifferentiators = differentiatorsByCategory[category] || [];
          
          if (categoryDifferentiators.length === 0) {
            return null;
          }
          
          return (
            <div key={category} className="form-section">
              <h3>{getCategoryDisplayName(category)}</h3>
              
              {categoryDifferentiators.map(differentiator => (
                <div key={differentiator.id || `new-${differentiator.title}`} className="differentiator-card">
                  <h4>{differentiator.title}</h4>
                  <p>{differentiator.description}</p>
                  <div className="priority-badge">Priority: {differentiator.priority}</div>
                  
                  <div className="differentiator-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEditDifferentiator(differentiator)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteDifferentiator(differentiator.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {formData.length === 0 && (
          <div className="no-differentiators">
            <p>No differentiators added yet. Click the "Add Differentiator" button to get started.</p>
          </div>
        )}

        {aiAssistEnabled && aiSuggestions && (
          <div className="ai-suggestions">
            <h3>AI Suggestions</h3>
            {isLoading ? (
              <p>Loading suggestions...</p>
            ) : (
              <>
                {aiSuggestions.differentiators && aiSuggestions.differentiators.length > 0 && (
                  <div className="suggestion-grid">
                    {aiSuggestions.differentiators.map((suggestion: any, index: number) => (
                      <div key={index} className="suggestion-item">
                        <h4>{suggestion.title}</h4>
                        <p>{suggestion.description}</p>
                        <span className="category-tag">{getCategoryDisplayName(suggestion.category)}</span>
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

export default DifferentiatorsStep;
