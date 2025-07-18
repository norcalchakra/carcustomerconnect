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
  CustomizationParameters,
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
import CustomizationStep from '../components/onboarding/CustomizationStep';
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
    customizationParams: null,
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
    { id: 3, name: 'Customization', component: CustomizationStep },
    { id: 4, name: 'Differentiators', component: DifferentiatorsStep },
    { id: 5, name: 'Content Governance', component: ContentGovernanceStep },
    { id: 6, name: 'Example Captions', component: ExampleCaptionsStep },
    { id: 7, name: 'Technical Integrations', component: TechnicalIntegrationsStep },
    { id: 8, name: 'Complete', component: OnboardingComplete }
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
      
      setLoading(true);
      try {
        // Fetch all onboarding data
        const profile = await dealerOnboardingApi.getDealershipProfile(dealershipId);
        const brandVoice = await dealerOnboardingApi.getBrandVoiceSettings(dealershipId);
        const lifecycleTemplates = await dealerOnboardingApi.getLifecycleTemplates(dealershipId);
        const customizationParams = await dealerOnboardingApi.getCustomizationParameters(dealershipId);
        const differentiators = await dealerOnboardingApi.getCompetitiveDifferentiators(dealershipId);
        const contentGovernance = await dealerOnboardingApi.getContentGovernance(dealershipId);
        const exampleCaptions = await dealerOnboardingApi.getExampleCaptions(dealershipId);
        const technicalIntegrations = await dealerOnboardingApi.getTechnicalIntegrations(dealershipId);
        
        // Calculate completed steps
        const completedSteps = [];
        let currentStep = 0;
        
        if (profile) {
          completedSteps.push(0);
          currentStep = 1;
        }
        
        if (brandVoice) {
          completedSteps.push(1);
          currentStep = 2;
        }
        
        if (lifecycleTemplates.length > 0) {
          completedSteps.push(2);
          currentStep = 3;
        }
        
        if (customizationParams) {
          completedSteps.push(3);
          currentStep = 4;
        }
        
        if (differentiators.length > 0) {
          completedSteps.push(4);
          currentStep = 5;
        }
        
        if (contentGovernance) {
          completedSteps.push(5);
          currentStep = 6;
        }
        
        if (exampleCaptions.length > 0) {
          completedSteps.push(6);
          currentStep = 7;
        }
        
        if (technicalIntegrations) {
          completedSteps.push(7);
          currentStep = 8;
        }
        
        // Update onboarding state
        setOnboardingState({
          profile,
          brandVoice,
          lifecycleTemplates,
          customizationParams,
          differentiators,
          contentGovernance,
          exampleCaptions,
          technicalIntegrations,
          currentStep,
          completedSteps
        });
      } catch (err) {
        console.error('Error loading onboarding data:', err);
        setError('Failed to load onboarding data');
      } finally {
        setLoading(false);
      }
    };
    
    loadOnboardingData();
  }, [dealershipId]);
  
  // Handle navigation between steps
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex <= steps.length - 1) {
      setOnboardingState(prev => ({
        ...prev,
        currentStep: stepIndex
      }));
    }
  };
  
  const nextStep = () => {
    if (onboardingState.currentStep < steps.length - 1) {
      goToStep(onboardingState.currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (onboardingState.currentStep > 0) {
      goToStep(onboardingState.currentStep - 1);
    }
  };
  
  // Mark current step as completed
  const completeCurrentStep = () => {
    setOnboardingState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, prev.currentStep])]
    }));
  };
  
  // Handle saving data for each step
  const handleSaveProfile = async (profile: DealershipProfile) => {
    if (!dealershipId) return;
    
    try {
      const updatedProfile = { ...profile, id: dealershipId };
      const savedProfile = await dealerOnboardingApi.saveDealershipProfile(updatedProfile);
      
      if (savedProfile) {
        setOnboardingState(prev => ({
          ...prev,
          profile: savedProfile
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
  };
  
  const handleSaveBrandVoice = async (brandVoice: BrandVoiceSettings) => {
    if (!dealershipId) return;
    
    try {
      const updatedBrandVoice = { ...brandVoice, id: dealershipId };
      const savedBrandVoice = await dealerOnboardingApi.saveBrandVoiceSettings(updatedBrandVoice);
      
      if (savedBrandVoice) {
        setOnboardingState(prev => ({
          ...prev,
          brandVoice: savedBrandVoice
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving brand voice:', err);
      setError('Failed to save brand voice settings');
    }
  };
  
  const handleSaveLifecycleTemplates = async (templates: LifecycleTemplate[]) => {
    if (!dealershipId) return;
    
    try {
      // Save each template individually
      const savedTemplates: LifecycleTemplate[] = [];
      
      for (const template of templates) {
        const templateWithDealershipId = {
          ...template,
          dealership_id: dealershipId
        };
        
        const savedTemplate = await dealerOnboardingApi.saveLifecycleTemplate(templateWithDealershipId);
        if (savedTemplate) {
          savedTemplates.push(savedTemplate);
        }
      }
      
      if (savedTemplates.length > 0) {
        setOnboardingState(prev => ({
          ...prev,
          lifecycleTemplates: savedTemplates
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving lifecycle templates:', err);
      setError('Failed to save lifecycle templates');
    }
  };
  
  const handleSaveCustomization = async (params: CustomizationParameters) => {
    if (!dealershipId) return;
    
    try {
      const updatedParams = { ...params, dealership_id: dealershipId };
      const savedParams = await dealerOnboardingApi.saveCustomizationParameters(updatedParams);
      
      if (savedParams) {
        setOnboardingState(prev => ({
          ...prev,
          customizationParams: savedParams
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving customization parameters:', err);
      setError('Failed to save customization parameters');
    }
  };
  
  const handleSaveDifferentiators = async (differentiators: CompetitiveDifferentiator[]) => {
    if (!dealershipId) return;
    
    try {
      // Save each differentiator individually
      const savedDifferentiators: CompetitiveDifferentiator[] = [];
      
      for (const differentiator of differentiators) {
        const differentiatorWithDealershipId = {
          ...differentiator,
          dealership_id: dealershipId
        };
        
        const savedDifferentiator = await dealerOnboardingApi.saveCompetitiveDifferentiator(differentiatorWithDealershipId);
        if (savedDifferentiator) {
          savedDifferentiators.push(savedDifferentiator);
        }
      }
      
      if (savedDifferentiators.length > 0) {
        setOnboardingState(prev => ({
          ...prev,
          differentiators: savedDifferentiators
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving differentiators:', err);
      setError('Failed to save competitive differentiators');
    }
  };
  
  const handleSaveContentGovernance = async (governance: ContentGovernance) => {
    if (!dealershipId) return;
    
    try {
      const updatedGovernance = { ...governance, dealership_id: dealershipId };
      const savedGovernance = await dealerOnboardingApi.saveContentGovernance(updatedGovernance);
      
      if (savedGovernance) {
        setOnboardingState(prev => ({
          ...prev,
          contentGovernance: savedGovernance
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving content governance:', err);
      setError('Failed to save content governance');
    }
  };
  
  const handleSaveExampleCaptions = async (captions: ExampleCaption[]) => {
    if (!dealershipId) return;
    
    try {
      // Save each caption individually
      const savedCaptions: ExampleCaption[] = [];
      
      for (const caption of captions) {
        const captionWithDealershipId = {
          ...caption,
          dealership_id: dealershipId
        };
        
        const savedCaption = await dealerOnboardingApi.saveExampleCaption(captionWithDealershipId);
        if (savedCaption) {
          savedCaptions.push(savedCaption);
        }
      }
      
      if (savedCaptions.length > 0) {
        setOnboardingState(prev => ({
          ...prev,
          exampleCaptions: savedCaptions
        }));
        completeCurrentStep();
        nextStep();
      }
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
      
      if (savedIntegrations) {
        setOnboardingState(prev => ({
          ...prev,
          technicalIntegrations: savedIntegrations
        }));
        completeCurrentStep();
        nextStep();
      }
    } catch (err) {
      console.error('Error saving technical integrations:', err);
      setError('Failed to save technical integrations');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading onboarding data...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  // Render the current step component with appropriate props
  const renderCurrentStep = () => {
    
    switch (onboardingState.currentStep) {
      case 0: // Business Profile
        return (
          <BusinessProfileStep
            profile={onboardingState.profile}
            onSave={handleSaveProfile}
            aiAssistEnabled={aiAssistEnabled}
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
      case 3: // Customization
        return (
          <CustomizationStep
            customizationParams={onboardingState.customizationParams}
            onSave={handleSaveCustomization}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 4: // Differentiators
        return (
          <DifferentiatorsStep
            differentiators={onboardingState.differentiators}
            onSave={handleSaveDifferentiators}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 5: // Content Governance
        return (
          <ContentGovernanceStep
            contentGovernance={onboardingState.contentGovernance}
            onSave={handleSaveContentGovernance}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 6: // Example Captions
        return (
          <ExampleCaptionsStep
            captions={onboardingState.exampleCaptions}
            onSave={handleSaveExampleCaptions}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 7: // Technical Integrations
        return (
          <TechnicalIntegrationsStep
            integrations={onboardingState.technicalIntegrations ? [onboardingState.technicalIntegrations] : []}
            onSave={(integrations) => handleSaveTechnicalIntegrations(integrations[0])}
            aiAssistEnabled={aiAssistEnabled}
            dealershipId={dealershipId}
          />
        );
      case 8: // Complete
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
  
  if (!dealershipId) {
    return <div className="error">No dealership found. Please create a dealership first.</div>;
  }
  
  return (
    <div className="dealer-onboarding-container">
      <div className="onboarding-header">
        <h1>Dealer Onboarding</h1>
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
