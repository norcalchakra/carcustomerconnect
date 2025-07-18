import { supabase } from './supabase';
import {
  DealershipProfile,
  BrandVoiceSettings,
  LifecycleTemplate,
  CustomizationParameters,
  CompetitiveDifferentiator,
  ContentGovernance,
  ExampleCaption,
  TechnicalIntegrations,
  OnboardingProgress,
  AISuggestionRequest,
  AISuggestionResponse
} from './dealerOnboardingTypes';

/**
 * Dealer Onboarding API service
 * Handles all interactions with the Supabase database for the dealer onboarding process
 */
export const dealerOnboardingApi = {
  /**
   * Get the dealership profile for the current user
   */
  async getDealershipProfile(dealershipId: number): Promise<DealershipProfile | null> {
    const { data, error } = await supabase
      .from('dealership_profiles')
      .select('*')
      .eq('id', dealershipId)
      .single();
    
    if (error) {
      console.error('Error fetching dealership profile:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Create or update the dealership profile
   */
  async saveDealershipProfile(profile: DealershipProfile): Promise<DealershipProfile | null> {
    const { data, error } = await supabase
      .from('dealership_profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving dealership profile:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get brand voice settings for a dealership
   */
  async getBrandVoiceSettings(dealershipId: number): Promise<BrandVoiceSettings | null> {
    const { data, error } = await supabase
      .from('brand_voice_settings')
      .select('*')
      .eq('id', dealershipId)
      .single();
    
    if (error) {
      console.error('Error fetching brand voice settings:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Save brand voice settings
   */
  async saveBrandVoiceSettings(settings: BrandVoiceSettings): Promise<BrandVoiceSettings | null> {
    const { data, error } = await supabase
      .from('brand_voice_settings')
      .upsert(settings, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving brand voice settings:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get lifecycle templates for a dealership
   */
  async getLifecycleTemplates(dealershipId: number): Promise<LifecycleTemplate[]> {
    const { data, error } = await supabase
      .from('lifecycle_templates')
      .select('*')
      .eq('dealership_id', dealershipId)
      .order('lifecycle_stage', { ascending: true });
    
    if (error) {
      console.error('Error fetching lifecycle templates:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Save a lifecycle template
   */
  async saveLifecycleTemplate(template: LifecycleTemplate): Promise<LifecycleTemplate | null> {
    const { data, error } = await supabase
      .from('lifecycle_templates')
      .upsert(template, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving lifecycle template:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Delete a lifecycle template
   */
  async deleteLifecycleTemplate(templateId: number): Promise<boolean> {
    const { error } = await supabase
      .from('lifecycle_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error('Error deleting lifecycle template:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Get customization parameters for a dealership
   */
  async getCustomizationParameters(dealershipId: number): Promise<CustomizationParameters | null> {
    const { data, error } = await supabase
      .from('customization_parameters')
      .select('*')
      .eq('id', dealershipId)
      .single();
    
    if (error) {
      console.error('Error fetching customization parameters:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Save customization parameters
   */
  async saveCustomizationParameters(params: CustomizationParameters): Promise<CustomizationParameters | null> {
    const { data, error } = await supabase
      .from('customization_parameters')
      .upsert(params, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving customization parameters:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get competitive differentiators for a dealership
   */
  async getCompetitiveDifferentiators(dealershipId: number): Promise<CompetitiveDifferentiator[]> {
    const { data, error } = await supabase
      .from('competitive_differentiators')
      .select('*')
      .eq('dealership_id', dealershipId)
      .order('category', { ascending: true });
    
    if (error) {
      console.error('Error fetching competitive differentiators:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Save a competitive differentiator
   */
  async saveCompetitiveDifferentiator(differentiator: CompetitiveDifferentiator): Promise<CompetitiveDifferentiator | null> {
    const { data, error } = await supabase
      .from('competitive_differentiators')
      .upsert(differentiator, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving competitive differentiator:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Delete a competitive differentiator
   */
  async deleteCompetitiveDifferentiator(differentiatorId: number): Promise<boolean> {
    const { error } = await supabase
      .from('competitive_differentiators')
      .delete()
      .eq('id', differentiatorId);
    
    if (error) {
      console.error('Error deleting competitive differentiator:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Get content governance rules for a dealership
   */
  async getContentGovernance(dealershipId: number): Promise<ContentGovernance | null> {
    const { data, error } = await supabase
      .from('content_governance')
      .select('*')
      .eq('id', dealershipId)
      .single();
    
    if (error) {
      console.error('Error fetching content governance:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Save content governance rules
   */
  async saveContentGovernance(governance: ContentGovernance): Promise<ContentGovernance | null> {
    const { data, error } = await supabase
      .from('content_governance')
      .upsert(governance, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving content governance:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get example captions for a dealership
   */
  async getExampleCaptions(dealershipId: number): Promise<ExampleCaption[]> {
    const { data, error } = await supabase
      .from('example_captions')
      .select('*')
      .eq('dealership_id', dealershipId)
      .order('lifecycle_stage', { ascending: true });
    
    if (error) {
      console.error('Error fetching example captions:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Save an example caption
   */
  async saveExampleCaption(caption: ExampleCaption): Promise<ExampleCaption | null> {
    const { data, error } = await supabase
      .from('example_captions')
      .upsert(caption, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving example caption:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Delete an example caption
   */
  async deleteExampleCaption(captionId: number): Promise<boolean> {
    const { error } = await supabase
      .from('example_captions')
      .delete()
      .eq('id', captionId);
    
    if (error) {
      console.error('Error deleting example caption:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Get technical integrations for a dealership
   */
  async getTechnicalIntegrations(dealershipId: number): Promise<TechnicalIntegrations | null> {
    const { data, error } = await supabase
      .from('technical_integrations')
      .select('*')
      .eq('id', dealershipId)
      .single();
    
    if (error) {
      console.error('Error fetching technical integrations:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Save technical integrations
   */
  async saveTechnicalIntegrations(integrations: TechnicalIntegrations): Promise<TechnicalIntegrations | null> {
    const { data, error } = await supabase
      .from('technical_integrations')
      .upsert(integrations, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving technical integrations:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get onboarding progress for a dealership
   */
  async getOnboardingProgress(dealershipId: number): Promise<OnboardingProgress | null> {
    // Check which sections have been completed
    const completedSections = [];
    let currentSection = 'profile';
    let completionPercentage = 0;
    
    // Check profile
    const profile = await this.getDealershipProfile(dealershipId);
    if (profile) {
      completedSections.push('profile');
      currentSection = 'brand_voice';
      completionPercentage += 12.5;
    }
    
    // Check brand voice
    const brandVoice = await this.getBrandVoiceSettings(dealershipId);
    if (brandVoice) {
      completedSections.push('brand_voice');
      currentSection = 'lifecycle_templates';
      completionPercentage += 12.5;
    }
    
    // Check lifecycle templates
    const templates = await this.getLifecycleTemplates(dealershipId);
    if (templates.length > 0) {
      completedSections.push('lifecycle_templates');
      currentSection = 'customization';
      completionPercentage += 12.5;
    }
    
    // Check customization parameters
    const customization = await this.getCustomizationParameters(dealershipId);
    if (customization) {
      completedSections.push('customization');
      currentSection = 'differentiators';
      completionPercentage += 12.5;
    }
    
    // Check differentiators
    const differentiators = await this.getCompetitiveDifferentiators(dealershipId);
    if (differentiators.length > 0) {
      completedSections.push('differentiators');
      currentSection = 'content_governance';
      completionPercentage += 12.5;
    }
    
    // Check content governance
    const governance = await this.getContentGovernance(dealershipId);
    if (governance) {
      completedSections.push('content_governance');
      currentSection = 'example_captions';
      completionPercentage += 12.5;
    }
    
    // Check example captions
    const captions = await this.getExampleCaptions(dealershipId);
    if (captions.length > 0) {
      completedSections.push('example_captions');
      currentSection = 'technical_integrations';
      completionPercentage += 12.5;
    }
    
    // Check technical integrations
    const integrations = await this.getTechnicalIntegrations(dealershipId);
    if (integrations) {
      completedSections.push('technical_integrations');
      currentSection = 'complete';
      completionPercentage += 12.5;
    }
    
    return {
      dealership_id: dealershipId,
      completed_sections: completedSections,
      current_section: currentSection,
      completion_percentage: completionPercentage,
      last_updated: new Date().toISOString()
    };
  },
  
  /**
   * Get AI-generated suggestions for onboarding sections
   * This will eventually call an AI service, but for now returns mock suggestions
   */
  async getAISuggestions(request: AISuggestionRequest): Promise<AISuggestionResponse> {
    // In a real implementation, this would call an AI service
    // For now, return mock suggestions based on the section
    
    switch (request.section) {
      case 'brand_voice':
        return {
          suggestions: {
            formality_level: 3,
            energy_level: 4,
            technical_detail_preference: 'benefit-focused',
            community_connection: 'regional',
            emoji_usage_level: 2
          },
          explanation: "Based on your dealership profile, a moderately formal, high-energy tone with benefit-focused messaging and regional community connections would appeal to your target market.",
          alternative_options: [
            {
              formality_level: 2,
              energy_level: 5,
              technical_detail_preference: 'lifestyle-oriented',
              community_connection: 'hyper-local',
              emoji_usage_level: 3,
              description: "More casual, extremely high-energy with lifestyle focus and hyper-local connections"
            },
            {
              formality_level: 4,
              energy_level: 3,
              technical_detail_preference: 'feature-heavy',
              community_connection: 'universal',
              emoji_usage_level: 1,
              description: "More formal, moderate energy with technical focus and universal appeal"
            }
          ]
        };
        
      case 'lifecycle_templates':
        return {
          suggestions: {
            acquisition: "Just in! This [Year] [Make] [Model] has arrived at our dealership and is ready for its next adventure. With only [Mileage] miles, it's in excellent condition and priced to move quickly!",
            service: "Our expert technicians are giving this [Year] [Make] [Model] the royal treatment! New [Service Item] being installed and a comprehensive inspection to ensure it's in top condition for its next owner.",
            ready_for_sale: "READY NOW! This [Year] [Make] [Model] has passed our rigorous inspection and is looking for its new home. Features include [Top Features]. Schedule your test drive today!",
            delivery: "Another happy customer! Congratulations to [First Name] on their new [Year] [Make] [Model]. We're honored you chose us for your automotive needs!"
          },
          explanation: "These templates maintain a positive, enthusiastic tone while highlighting key vehicle information and encouraging action.",
          alternative_options: []
        };
        
      default:
        return {
          suggestions: {},
          explanation: "AI suggestions not available for this section yet.",
          alternative_options: []
        };
    }
  }
};

export default dealerOnboardingApi;
