import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import dealerOnboardingApi from '../lib/dealerOnboardingApi';
import {
  DealerOnboardingState,
  DealershipProfile,
  BrandVoiceSettings,
  LifecycleTemplate,
  CompetitiveDifferentiator,
  ContentGovernance,
  ExampleCaption,
  TechnicalIntegrations
} from '../lib/dealerOnboardingTypes';
import './DealerOnboardingPage.css';

// Import onboarding step components
import BusinessProfileStep from '../components/onboarding/BusinessProfileStep';
import BrandVoiceStep from '../components/onboarding/BrandVoiceStep';
import LifecycleTemplatesStep from '../components/onboarding/LifecycleTemplatesStep';
import DifferentiatorsStep from '../components/onboarding/DifferentiatorsStep';
import ContentGovernanceStep from '../components/onboarding/ContentGovernanceStep';
import ExampleCaptionsStep from '../components/onboarding/ExampleCaptionsStep';
import TechnicalIntegrationsStep from '../components/onboarding/TechnicalIntegrationsStep';
import OnboardingComplete from '../components/onboarding/OnboardingComplete';

const DealerOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for the entire onboarding process
  const [onboardingState, setOnboardingState] = useState<DealerOnboardingState>({
    profile: null,
    brandVoice: null,
    lifecycleTemplates: [],
    differentiators: [],
    contentGovernance: null,
    exampleCaptions: [],
    technicalIntegrations: null,
    currentStep: 0,
    completedSteps: []
  });
  
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiAssistEnabled, setAiAssistEnabled] = useState<boolean>(true);
  
  // Toggle AI assistance on/off
  const toggleAIAssist = () => {
    setAiAssistEnabled(prev => !prev);
  };
  
  // Define the steps in the onboarding process
  const steps = [
    { id: 0, name: 'Business Profile', component: BusinessProfileStep },
    { id: 1, name: 'Brand Voice', component: BrandVoiceStep },
    { id: 2, name: 'Lifecycle Templates', component: LifecycleTemplatesStep },
    { id: 3, name: 'Differentiators', component: DifferentiatorsStep },
    { id: 4, name: 'Content Governance', component: ContentGovernanceStep },
    { id: 5, name: 'Example Captions', component: ExampleCaptionsStep },
    { id: 6, name: 'Technical Integrations', component: TechnicalIntegrationsStep },
    { id: 7, name: 'Complete', component: OnboardingComplete }
  ];
  
  // Fetch dealership ID for the current user
  useEffect(() => {
    const getDealershipId = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('dealerships')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) setDealershipId(data.id);
      } catch (err) {
        console.error('Error fetching dealership:', err);
        setError('Failed to load dealership information');
      } finally {
        setLoading(false);
      }
    };

    getDealershipId();
  }, [user, navigate]);
  
  // Load existing onboarding data when dealership ID is available
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!dealershipId) return;
      
      try {
        // Load profile
        const profile = await dealerOnboardingApi.getDealershipProfile(dealershipId);
        
        // Load brand voice settings
        const brandVoice = await dealerOnboardingApi.getBrandVoiceSettings(dealershipId);
        
        // Load lifecycle templates
        const templates = await dealerOnboardingApi.getAllLifecycleTemplates(dealershipId);
        
        // Customization step removed
        
        // Load differentiators
        const differentiators = await dealerOnboardingApi.getCompetitiveDifferentiators(dealershipId);
        
        // Load content governance
        const governance = await dealerOnboardingApi.getContentGovernance(dealershipId);
        
        // Load example captions
        const captions = await dealerOnboardingApi.getExampleCaptions(dealershipId);
        
        // Load technical integrations
        const integrations = await dealerOnboardingApi.getTechnicalIntegrations(dealershipId);
        
        // Calculate completed steps
        const completedSteps: number[] = [];
        if (profile) completedSteps.push(0);
        if (brandVoice) completedSteps.push(1);
        if (templates.length > 0) completedSteps.push(2);
        if (differentiators.length > 0) completedSteps.push(3);
        if (governance) completedSteps.push(4);
        if (captions.length > 0) completedSteps.push(5);
        if (integrations) completedSteps.push(6);
        
        // Update state with loaded data
        setOnboardingState({
          profile,
          brandVoice,
          lifecycleTemplates: templates,
          differentiators,
          contentGovernance: governance,
          exampleCaptions: captions,
          technicalIntegrations: integrations,
          currentStep: completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 0,
          completedSteps
        });
      } catch (err) {
        console.error('Error loading onboarding data:', err);
        setError('Failed to load onboarding data');
      }
    };
    
    loadOnboardingData();
  }, [dealershipId]);
  
  // Navigation functions
  const goToStep = (step: number) => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: step
    }));
  };
  
  const nextStep = () => {
    if (onboardingState.currentStep < steps.length - 1) {
      setOnboardingState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    }
  };
  
  const prevStep = () => {
    if (onboardingState.currentStep > 0) {
      setOnboardingState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };
  
  const completeCurrentStep = () => {
    setOnboardingState(prev => {
      if (prev.completedSteps.includes(prev.currentStep)) {
        return prev;
      }
      
      return {
        ...prev,
        completedSteps: [...prev.completedSteps, prev.currentStep]
      };
    });
  };
  
  // Save handlers for each step
  const handleSaveProfile = async (profile: DealershipProfile) => {
    if (!dealershipId) return;
    
    try {
      const updatedProfile = { ...profile, id: dealershipId };
      const savedProfile = await dealerOnboardingApi.saveDealershipProfile(updatedProfile);
      
      setOnboardingState(prev => ({
        ...prev,
        profile: savedProfile
      }));
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
  };
  
  const handleSaveBrandVoice = async (brandVoice: BrandVoiceSettings) => {
    if (!dealershipId) return;
    
    try {
      const updatedBrandVoice = { ...brandVoice, dealership_id: dealershipId };
      const savedBrandVoice = await dealerOnboardingApi.saveBrandVoiceSettings(updatedBrandVoice);
      
      setOnboardingState(prev => ({
        ...prev,
        brandVoice: savedBrandVoice
      }));
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error saving brand voice settings:', err);
      setError('Failed to save brand voice settings');
    }
  };
  
  const handleSaveLifecycleTemplates = async (templates: LifecycleTemplate[]) => {
    if (!dealershipId) {
      console.error('Cannot save templates: dealershipId is null');
      setError('Failed to save lifecycle templates: Missing dealership ID');
      return;
    }
    
    try {
      console.log('Templates received from component:', JSON.stringify(templates, null, 2));
      console.log('Number of templates:', templates.length);
      
      // Since templates are now saved individually in the LifecycleTemplatesStep component,
      // we just need to update our state with the current templates and move to the next step
      
      // Fetch all templates from the database to ensure we have the latest state
      const allTemplates = await dealerOnboardingApi.getLifecycleTemplates(Number(dealershipId));
      console.log('All templates in database:', JSON.stringify(allTemplates, null, 2));
      
      // Group templates by lifecycle stage for better organization
      const templatesByStage: Record<string, LifecycleTemplate[]> = {};
      
      // Initialize with empty arrays for each stage
      ['acquisition', 'service', 'ready_for_sale', 'delivery'].forEach(stage => {
        templatesByStage[stage] = [];
      });
      
      // Populate with actual templates
      allTemplates.forEach(template => {
        const stage = template.lifecycle_stage;
        if (!templatesByStage[stage]) {
          templatesByStage[stage] = [];
        }
        templatesByStage[stage].push(template);
      });
      
      console.log('Templates by stage:', templatesByStage);
      
      // Update the state with all templates from the database
      setOnboardingState(prev => ({
        ...prev,
        lifecycleTemplates: allTemplates
      }));
      
      // Show success message
      setSuccess('Successfully saved all lifecycle templates');
      setTimeout(() => setSuccess(null), 3000);
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error updating lifecycle templates state:', err);
      setError('Failed to update lifecycle templates');
    }
  };
  
  // Customization step removed
  
  const handleSaveDifferentiators = async (differentiators: CompetitiveDifferentiator[]) => {
    if (!dealershipId) {
      console.error('Cannot save differentiators: dealershipId is null');
      setError('Failed to save differentiators: Missing dealership ID');
      return;
    }
    
    try {
      console.log('Differentiators received from component:', JSON.stringify(differentiators, null, 2));
      console.log('Number of differentiators:', differentiators.length);
      
      // Since differentiators are now saved individually in the DifferentiatorsStep component,
      // we just need to update our state with the current differentiators and move to the next step
      
      // Fetch all differentiators from the database to ensure we have the latest state
      const allDifferentiators = await dealerOnboardingApi.getCompetitiveDifferentiators(Number(dealershipId));
      console.log('All differentiators in database:', JSON.stringify(allDifferentiators, null, 2));
      
      // Group differentiators by category for better organization
      const differentiatorsByCategory: Record<string, CompetitiveDifferentiator[]> = {};
      
      // Initialize with empty arrays for each category
      ['service', 'customer_experience', 'financial', 'inventory', 'warranty', 'community', 'other'].forEach(category => {
        differentiatorsByCategory[category] = [];
      });
      
      // Populate with actual differentiators
      allDifferentiators.forEach(differentiator => {
        const category = differentiator.category;
        if (!differentiatorsByCategory[category]) {
          differentiatorsByCategory[category] = [];
        }
        differentiatorsByCategory[category].push(differentiator);
      });
      
      console.log('Differentiators by category:', differentiatorsByCategory);
      
      // Update the state with all differentiators from the database
      setOnboardingState(prev => ({
        ...prev,
        differentiators: allDifferentiators
      }));
      
      // Show success message
      setSuccess('Successfully saved all differentiators');
      setTimeout(() => setSuccess(null), 3000);
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error updating differentiators state:', err);
      setError('Failed to update differentiators');
    }
  };
  
  const handleSaveContentGovernance = async (governance: ContentGovernance) => {
    if (!dealershipId) return;
    
    try {
      const updatedGovernance = { ...governance, dealership_id: dealershipId };
      const savedGovernance = await dealerOnboardingApi.saveContentGovernance(updatedGovernance);
      
      setOnboardingState(prev => ({
        ...prev,
        contentGovernance: savedGovernance
      }));
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error saving content governance:', err);
      setError('Failed to save content governance');
    }
  };
  
  const handleSaveExampleCaptions = async (captions: ExampleCaption[]) => {
    if (!dealershipId) return;
    
    try {
      const updatedCaptions = captions.map(c => ({
        ...c,
        dealership_id: dealershipId
      }));
      
      // Save each caption individually
      const savedCaptions: ExampleCaption[] = [];
      
      for (const caption of updatedCaptions) {
        const savedCaption = await dealerOnboardingApi.saveExampleCaption(caption);
        if (savedCaption) {
          savedCaptions.push(savedCaption);
        }
      }
      
      setOnboardingState(prev => ({
        ...prev,
        exampleCaptions: savedCaptions
      }));
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error saving example captions:', err);
      setError('Failed to save example captions');
    }
  };
  
  const handleSaveTechnicalIntegrations = async (integrations: TechnicalIntegrations) => {
    if (!dealershipId) return;
    
    try {
      const updatedIntegrations = { ...integrations, dealership_id: dealershipId };
      const savedIntegrations = await dealerOnboardingApi.saveTechnicalIntegrations(updatedIntegrations);
      
      setOnboardingState(prev => ({
        ...prev,
        technicalIntegrations: savedIntegrations
      }));
      
      completeCurrentStep();
      nextStep();
    } catch (err) {
      console.error('Error saving technical integrations:', err);
      setError('Failed to save technical integrations');
    }
  };
  
  // Render the current step
  const renderCurrentStep = () => {
    switch (onboardingState.currentStep) {
      case 0: // Business Profile
        return (
          <BusinessProfileStep
            profile={onboardingState.profile}
            onSave={handleSaveProfile}
            dealershipId={dealershipId}
          />
        );
      case 1: // Brand Voice
        return (
          <BrandVoiceStep
            brandVoice={onboardingState.brandVoice}
            onSave={handleSaveBrandVoice}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 2: // Lifecycle Templates
        return (
          <LifecycleTemplatesStep
            templates={onboardingState.lifecycleTemplates}
            onSave={handleSaveLifecycleTemplates}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 3: // Differentiators
        return (
          <DifferentiatorsStep
            differentiators={onboardingState.differentiators}
            onSave={handleSaveDifferentiators}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 4: // Content Governance
        return (
          <ContentGovernanceStep
            contentGovernance={onboardingState.contentGovernance}
            onSave={handleSaveContentGovernance}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 5: // Example Captions
        return (
          <ExampleCaptionsStep
            captions={onboardingState.exampleCaptions}
            onSave={handleSaveExampleCaptions}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 6: // Technical Integrations
        return (
          <TechnicalIntegrationsStep
            integrations={onboardingState.technicalIntegrations ? [onboardingState.technicalIntegrations] : []}
            onSave={(integrations) => handleSaveTechnicalIntegrations(integrations[0])}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 7: // Complete
        return (
          <OnboardingComplete
            onboardingProgress={onboardingState.completedSteps}
            totalSteps={steps.length - 1}
            dealershipId={dealershipId}
          />
        );
      default:
        return <div>Step not found</div>;
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!dealershipId) {
    return <div className="error">No dealership found. Please create a dealership first.</div>;
  }
  
  return (
    <div className="dealer-onboarding-container">
      <div className="onboarding-header">
        <h1>Dealer Onboarding</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <p>Complete the following steps to set up your dealership's AI-powered content generation system.</p>
        
        <div className="ai-assist-toggle">
          <label>
            <input
              type="checkbox"
              checked={aiAssistEnabled}
              onChange={toggleAIAssist}
            />
            AI Assistance
          </label>
          <span className="ai-assist-info">
            {aiAssistEnabled ? 'AI will suggest content based on your inputs' : 'AI suggestions disabled'}
          </span>
        </div>
      </div>
      
      <div className="onboarding-progress">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step ${index === onboardingState.currentStep ? 'active' : ''} ${
              onboardingState.completedSteps.includes(index) ? 'completed' : ''
            }`}
            onClick={() => {
              // Allow navigation to completed steps or the current step + 1
              if (
                onboardingState.completedSteps.includes(index) ||
                index === onboardingState.currentStep ||
                index === onboardingState.completedSteps.length
              ) {
                goToStep(index);
              }
            }}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-name">{step.name}</div>
          </div>
        ))}
      </div>
      
      <div className="onboarding-content">
        {renderCurrentStep()}
      </div>
      
      <div className="onboarding-navigation">
        {onboardingState.currentStep > 0 && (
          <button className="prev-button" onClick={prevStep}>
            Previous
          </button>
        )}
        
        {onboardingState.currentStep < steps.length - 1 && (
          <button
            className="skip-button"
            onClick={() => {
              completeCurrentStep();
              nextStep();
            }}
          >
            Skip for now
          </button>
        )}
        
        {onboardingState.currentStep === steps.length - 1 && (
          <button
            className="finish-button"
            onClick={() => navigate('/dashboard')}
          >
            Finish & Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default DealerOnboardingPage;
