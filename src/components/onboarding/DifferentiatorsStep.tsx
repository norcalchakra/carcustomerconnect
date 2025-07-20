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
      <div className="modal-overlay" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000, 
        padding: '1rem' 
      }}>
        <div className="modal-content modal-md" style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          width: '100%', 
          maxWidth: '500px', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {/* Modal Header */}
          <div className="modal-header" style={{ 
            padding: '1rem', 
            borderBottom: '1px solid #e2e8f0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.25rem', 
              fontWeight: 500, 
              color: '#334155' 
            }}>
              {currentDifferentiator.id ? 'Edit' : 'Add'} Differentiator
            </h3>
            <button
              onClick={handleCancelEdit}
              className="modal-close"
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '0.25rem' 
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Modal Body */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="category" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: '#64748b' 
                }}
              >
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={currentDifferentiator.category}
                onChange={handleDifferentiatorChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.625rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '0.875rem', 
                  color: '#334155' 
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="title" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: '#64748b' 
                }}
              >
                Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={currentDifferentiator.title}
                onChange={handleDifferentiatorChange}
                placeholder="e.g. Award-Winning Service Department"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.625rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '0.875rem', 
                  color: '#334155' 
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="description" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: '#64748b' 
                }}
              >
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={currentDifferentiator.description}
                onChange={handleDifferentiatorChange}
                placeholder="Describe what makes this a differentiator for your dealership..."
                rows={4}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.625rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '0.875rem', 
                  color: '#334155', 
                  resize: 'vertical', 
                  minHeight: '100px' 
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="priority" 
                style={{ 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Priority (1-10)</span>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  color: '#64748b', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  minWidth: '2rem', 
                  textAlign: 'center' 
                }}>
                  {currentDifferentiator.priority}
                </div>
              </label>
              <input
                type="range"
                id="priority"
                name="priority"
                value={currentDifferentiator.priority}
                onChange={handleDifferentiatorChange}
                min="1"
                max="10"
                step="1"
                style={{ 
                  width: '100%', 
                  padding: '0.625rem 0', 
                }}
              />
              <p style={{ 
                margin: '0.5rem 0 0', 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                fontStyle: 'italic' 
              }}>
                Lower numbers will be featured more prominently in content.
              </p>
            </div>
            
            {error && <div style={{ 
              color: '#ef4444', 
              padding: '0.75rem', 
              backgroundColor: '#fef2f2', 
              borderRadius: '0.25rem', 
              marginBottom: '1rem', 
              fontSize: '0.875rem' 
            }}>{error}</div>}
          </div>
          
          {/* Modal Footer */}
          <div style={{ 
            borderTop: '1px solid #e2e8f0', 
            padding: '1rem', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '0.75rem' 
          }}>
            <button 
              type="button" 
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
              onClick={handleSaveDifferentiator}
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
              Save Differentiator
            </button>
          </div>
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
          marginBottom: '1rem'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        Add New Differentiator
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
              
              <div className="differentiators-grid">
                {categoryDifferentiators.map(differentiator => (
                  <div key={differentiator.id || `new-${differentiator.title}`} style={{ backgroundColor: '#f8fafc', borderRadius: '0.25rem', padding: '1rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {differentiator.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleEditDifferentiator(differentiator)}
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
                          onClick={() => handleDeleteDifferentiator(differentiator.id)}
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
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0' }}>{differentiator.description}</p>
                    <div style={{ display: 'inline-block', backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}>Priority: {differentiator.priority}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {formData.length === 0 && (
          <div className="no-differentiators">
            <p>No differentiators added yet. Click the "Add Differentiator" button to get started.</p>
          </div>
        )}

        {aiAssistEnabled && aiSuggestions && (
          <div style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '0.25rem', 
            padding: '1rem', 
            marginTop: '1.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '0.75rem', 
              borderBottom: '1px solid #e2e8f0', 
              paddingBottom: '0.75rem' 
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: '#334155' }}>AI Suggestions</h4>
            </div>
            {isLoading ? (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading suggestions...</p>
            ) : (
              <>
                {aiSuggestions.differentiators && aiSuggestions.differentiators.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {aiSuggestions.differentiators.map((suggestion: any, index: number) => (
                      <div key={index} style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '0.25rem', 
                        padding: '1rem', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#334155' }}>{suggestion.title}</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0' }}>{suggestion.description}</p>
                        <div style={{ display: 'inline-block', backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}>{getCategoryDisplayName(suggestion.category)}</div>
                        <button
                          type="button"
                          onClick={() => applySuggestion(suggestion)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            backgroundColor: '#f8fafc', 
                            color: '#64748b', 
                            border: '1px solid #e2e8f0', 
                            padding: '0.5rem 0.75rem', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.75rem', 
                            fontWeight: 500, 
                            cursor: 'pointer',
                            marginTop: '0.75rem',
                            width: 'fit-content'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          Add This Differentiator
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && <div style={{ color: '#ef4444', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.25rem', marginBottom: '1rem' }}>{error}</div>}

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

export default DifferentiatorsStep;
