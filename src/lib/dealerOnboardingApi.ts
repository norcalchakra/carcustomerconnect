import { supabase } from './supabase';
import {
  DealershipProfile,
  BrandVoiceSettings,
  LifecycleTemplate,
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
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching dealership profile:', error);
      return null;
    }
    
    return data || null;
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
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching brand voice settings:', error);
      return null;
    }
    
    return data || null;
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
   * Get all lifecycle templates for a dealership
   */
  async getAllLifecycleTemplates(dealershipId: number): Promise<LifecycleTemplate[]> {
    const { data, error } = await supabase
      .from('lifecycle_templates')
      .select('*')
      .eq('dealership_id', dealershipId);
    
    if (error) {
      console.error('Error fetching all lifecycle templates:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Save a lifecycle template
   */
  async saveLifecycleTemplate(template: LifecycleTemplate): Promise<LifecycleTemplate | null> {
    console.log('Saving lifecycle template:', JSON.stringify(template, null, 2));
    console.log('Template dealership_id:', template.dealership_id);
    console.log('Template lifecycle_stage:', template.lifecycle_stage);
    
    // Ensure dealership_id is a number
    if (typeof template.dealership_id !== 'number') {
      template.dealership_id = Number(template.dealership_id);
      console.log('Converted dealership_id to number:', template.dealership_id);
    }
    
    // First, check if we can fetch from the database
    const { data: checkData, error: fetchError } = await supabase
      .from('lifecycle_templates')
      .select('count')
      .eq('dealership_id', template.dealership_id);
    
    console.log('Database check result:', checkData);
    
    if (fetchError) {
      console.error('Error accessing templates table:', fetchError);
      console.error('Error details:', fetchError.details, fetchError.hint, fetchError.message);
      return null;
    }
    
    // Validate required fields
    if (!template.template_name || !template.template_content || !template.lifecycle_stage) {
      console.error('Missing required fields for template:', template);
      return null;
    }
    
    // If this is a new template (id = 0), we'll insert it
    // If it's an existing template (id > 0), we'll update it
    // We're NOT using the lifecycle_stage to determine if a template exists anymore
    let operation;
    
    // Make sure we have a clean object for database operations
    const templateToSave = {
      id: template.id,
      dealership_id: template.dealership_id,
      lifecycle_stage: template.lifecycle_stage,
      template_name: template.template_name,
      template_content: template.template_content,
      is_active: template.is_active !== undefined ? template.is_active : true
    };
    
    console.log('Clean template object for database:', templateToSave);
    
    if (template.id === 0) {
      // This is a new template, so insert it
      console.log(`Creating new template for ${template.lifecycle_stage} stage:`, JSON.stringify(templateToSave, null, 2));
      
      // Remove the id field for new templates
      const { id, ...newTemplate } = templateToSave;
      
      operation = supabase
        .from('lifecycle_templates')
        .insert(newTemplate)
        .select()
        .single();
    } else {
      // This is an existing template, so update it
      console.log(`Updating existing template ID ${template.id} for ${template.lifecycle_stage} stage:`, JSON.stringify(templateToSave, null, 2));
      operation = supabase
        .from('lifecycle_templates')
        .update(templateToSave)
        .eq('id', template.id)
        .select()
        .single();
    }
    
    const { data, error } = await operation;
    
    if (error) {
      console.error('Error saving lifecycle template:', error);
      console.error('Error details:', error.details, error.hint, error.message);
      console.error('Error code:', error.code);
      console.error('Failed template data:', JSON.stringify(templateToSave, null, 2));
      return null;
    }
    
    console.log(`Successfully saved template for ${template.lifecycle_stage} stage:`, data);
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
  
  // Customization step removed
  
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
    console.log('Saving differentiator:', JSON.stringify(differentiator, null, 2));
    
    // Ensure dealership_id is a number
    if (typeof differentiator.dealership_id !== 'number') {
      differentiator.dealership_id = Number(differentiator.dealership_id);
      console.log('Converted dealership_id to number:', differentiator.dealership_id);
    }
    
    // Validate required fields
    if (!differentiator.title || !differentiator.description || !differentiator.category) {
      console.error('Missing required fields for differentiator:', differentiator);
      return null;
    }
    
    // Make sure we have a clean object for database operations
    const differentiatorToSave = {
      id: differentiator.id,
      dealership_id: differentiator.dealership_id,
      category: differentiator.category,
      title: differentiator.title,
      description: differentiator.description,
      priority: differentiator.priority || 1
    };
    
    let operation;
    
    if (differentiator.id === 0) {
      // This is a new differentiator, so insert it
      console.log(`Creating new differentiator for ${differentiator.category} category:`, JSON.stringify(differentiatorToSave, null, 2));
      
      // Remove the id field for new differentiators
      const { id, ...newDifferentiator } = differentiatorToSave;
      
      operation = supabase
        .from('competitive_differentiators')
        .insert(newDifferentiator)
        .select()
        .single();
    } else {
      // This is an existing differentiator, so update it
      console.log(`Updating existing differentiator ID ${differentiator.id}:`, JSON.stringify(differentiatorToSave, null, 2));
      operation = supabase
        .from('competitive_differentiators')
        .update(differentiatorToSave)
        .eq('id', differentiator.id)
        .select()
        .single();
    }
    
    const { data, error } = await operation;
    
    if (error) {
      console.error('Error saving competitive differentiator:', error);
      console.error('Error details:', error.details, error.hint, error.message);
      console.error('Error code:', error.code);
      console.error('Failed differentiator data:', JSON.stringify(differentiatorToSave, null, 2));
      return null;
    }
    
    console.log(`Successfully saved differentiator:`, data);
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
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching content governance:', error);
      return null;
    }
    
    return data || null;
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
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching technical integrations:', error);
      return null;
    }
    
    return data || null;
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
      completionPercentage += 14.3; // Updated from 12.5% for 7 steps instead of 8
    }
    
    // Check brand voice
    const brandVoice = await this.getBrandVoiceSettings(dealershipId);
    if (brandVoice) {
      completedSections.push('brand_voice');
      currentSection = 'lifecycle_templates';
      completionPercentage += 14.3; // Updated from 12.5% for 7 steps instead of 8
    }
    
    // Check lifecycle templates
    const templates = await this.getLifecycleTemplates(dealershipId);
    if (templates.length > 0) {
      completedSections.push('lifecycle_templates');
      currentSection = 'differentiators';
      completionPercentage += 14.3;
    }
    
    // Check differentiators
    const differentiators = await this.getCompetitiveDifferentiators(dealershipId);
    if (differentiators.length > 0) {
      completedSections.push('differentiators');
      currentSection = 'content_governance';
      completionPercentage += 14.3;
    }
    
    // Check content governance
    const governance = await this.getContentGovernance(dealershipId);
    if (governance) {
      completedSections.push('content_governance');
      currentSection = 'example_captions';
      completionPercentage += 14.3;
    }
    
    // Check example captions
    const captions = await this.getExampleCaptions(dealershipId);
    if (captions.length > 0) {
      completedSections.push('example_captions');
      currentSection = 'technical_integrations';
      completionPercentage += 14.3;
    }
    
    // Check technical integrations
    const integrations = await this.getTechnicalIntegrations(dealershipId);
    if (integrations) {
      completedSections.push('technical_integrations');
      currentSection = 'complete';
      completionPercentage += 14.3;
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
    // For now, generate mock  async getAISuggestions(request: any): Promise<any> {
    // Log what we received for debugging
    console.log('AI API received request:', request);
    
    if (request.section === 'brand_voice') {
      return {
        suggestions: {
          formality_level: 3,
          energy_level: 4,
          technical_detail_preference: 'benefit-focused',
          community_connection: 'regional',
          emoji_usage_level: 2
        },
        explanation: "Based on your dealership profile, a moderately formal, high-energy tone with benefit-focused messaging and regional community connections would appeal to your target market.",
        alternative_options: []
      };
    }
    
    if (request.section === 'lifecycle_templates') {
      try {
        // Extract data from the request
        const { lifecycle_stage, business_profile, brand_voice } = request.current_data;
        const dealershipName = business_profile?.dba_name || business_profile?.legal_name || 'our dealership';
        const yearsInBusiness = business_profile?.years_in_business || 0;
        const dealershipType = business_profile?.dealership_type || 'used';
        const location = business_profile?.physical_address?.split(',')[1]?.trim() || 'local';
        
        // Extract brand voice preferences
        const formality = brand_voice?.formality_level || 3; // 1-5 scale
        const energy = brand_voice?.energy_level || 3; // 1-5 scale
        const technicalDetail = brand_voice?.technical_detail_preference || 'benefit-focused';
        const communityConnection = brand_voice?.community_connection || 'regional';
        const emojiUsage = brand_voice?.emoji_usage_level || 0; // 0-5 scale
        
        // Prepare the prompt for OpenAI
        const formalityText = formality <= 2 ? 'casual' : formality >= 4 ? 'formal' : 'moderately formal';
        const energyText = energy >= 4 ? 'high energy' : energy <= 2 ? 'low energy' : 'moderate energy';
        const emojiText = emojiUsage >= 3 ? 'use emojis liberally' : emojiUsage > 0 ? 'use emojis sparingly' : 'do not use emojis';
        
        // Get lifecycle stage specific context
        const getLifecycleContext = () => {
          switch (lifecycle_stage) {
            case 'acquisition':
              return 'This is when a vehicle first arrives at the dealership. It is typically not yet ready for sale, might be dirty, needs inspection, and possibly repairs. The focus is on announcing the arrival and building anticipation for when it will be available.';
            case 'service':
              return 'This is when the vehicle is being serviced, repaired, detailed, or prepared for sale. The focus is on the quality of work being done, attention to detail, and the dealership\'s commitment to quality.';
            case 'ready_for_sale':
              return 'This is when the vehicle is fully prepared, detailed, photographed, and available for customers to view and purchase. The focus is on highlighting features and encouraging customers to come see it.';
            case 'delivery':
              return 'This is when the vehicle has been sold and is being delivered to its new owner. The focus is on customer satisfaction, celebrating the purchase, and building community goodwill.';
            default:
              return 'This is a general update about a vehicle in the dealership\'s inventory.';
          }
        };

        // Create a prompt that includes all the relevant information
        const prompt = `
          Create a single, unique social media post for a car dealership about a vehicle at a specific lifecycle stage.
          
          DEALERSHIP INFORMATION:
          - Name: ${dealershipName}
          - Years in business: ${yearsInBusiness}
          - Type: ${dealershipType} car dealership
          - Location: ${location}
          
          BRAND VOICE SETTINGS:
          - Tone: ${formalityText}
          - Energy level: ${energyText}
          - Technical detail: ${technicalDetail}
          - Community connection: ${communityConnection}
          - Emoji usage: ${emojiText}
          
          LIFECYCLE STAGE: ${lifecycle_stage.replace('_', ' ')}
          LIFECYCLE CONTEXT: ${getLifecycleContext()}
          
          Create a unique, creative post that matches the dealership's brand voice and accurately reflects the vehicle's current lifecycle stage. The post should be 1-2 sentences long and directly usable as a social media caption.
          
          IMPORTANT INSTRUCTIONS:
          1. Use generic vehicle references like "this vehicle", "this car", "this truck", or "this SUV" instead of specific makes/models
          2. Do not mention specific years, makes, models, or mileage numbers
          3. Focus on the dealership's value proposition and the current lifecycle stage reality
          4. Each generation should be unique and different from previous ones
          5. The template should work for any type of vehicle (new, used, old, high-mileage, etc.)
          6. Be authentic about the current state of the vehicle based on its lifecycle stage
        `;
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are an expert automotive marketing assistant that creates engaging social media content for car dealerships.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 150
          })
        });
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const generatedTemplate = data.choices[0].message.content.trim();
        
        // Create a response with only the current lifecycle stage template
        const aiResponse: AISuggestionResponse = {
          suggestions: {
            [lifecycle_stage]: generatedTemplate
          },
          explanation: `Template customized for your ${formalityText} tone, ${energyText} level, ${technicalDetail} technical approach, and ${communityConnection} community focus.`,
          alternative_options: []
        };
        
        console.log('AI API returning response:', aiResponse);
        return aiResponse;
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        
        // Fallback to mock response if API call fails
        const { lifecycle_stage, business_profile } = request.current_data;
        const dealershipName = business_profile?.legal_name || 'our dealership';
        
        return {
          suggestions: {
            [lifecycle_stage]: `New arrival at ${dealershipName}! We've just added another quality vehicle to our inventory. Contact us to learn more about our latest offerings.`
          },
          explanation: 'Generated using fallback template due to API error. Please try again later.',
          alternative_options: []
        };
      }
    }
    
    return {
      suggestions: {},
      explanation: 'No suggestions available for this section.',
      alternative_options: []
    };
  },

  /**
   * Get a summary of the dealership's onboarding data
   */
  async getDealershipSummary(dealershipId: number): Promise<any> {
    try {
      // Fetch all the necessary data for the summary
      const profile = await this.getDealershipProfile(dealershipId);
      const brandVoice = await this.getBrandVoiceSettings(dealershipId);
      const templates = await this.getLifecycleTemplates(dealershipId);
      const differentiators = await this.getCompetitiveDifferentiators(dealershipId);
      const governance = await this.getContentGovernance(dealershipId);
      const integrations = await this.getTechnicalIntegrations(dealershipId);
      
      // Return a consolidated summary
      return {
        profile,
        brandVoice,
        templates: {
          count: templates.length,
          stages: [...new Set(templates.map(t => t.lifecycle_stage))].length
        },
        differentiators: {
          count: differentiators.length
        },
        governance,
        integrations
      };
    } catch (error) {
      console.error('Error generating dealership summary:', error);
      throw error;
    }
  }
};

export default dealerOnboardingApi;
