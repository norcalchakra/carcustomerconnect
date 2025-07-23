import { supabase } from './supabase';
import { Vehicle, Dealership } from './api';
import { dealerOnboardingApi } from './dealerOnboardingApi';
import {
  DealershipProfile,
  BrandVoiceSettings,
  LifecycleTemplate,
  CompetitiveDifferentiator,
  ExampleCaption
} from './dealerOnboardingTypes';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo'; // You can upgrade to gpt-4 if needed

// Function to get the OpenAI API key from environment variables or Supabase
const getOpenAIApiKey = async (): Promise<string> => {
  // First try to get from environment variables
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envApiKey) {
    return envApiKey;
  }
  
  // If not in env, try to get from Supabase settings table
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'openai_api_key')
      .single();
      
    if (error) throw error;
    if (data && data.value) {
      return data.value;
    }
  } catch (err) {
    console.error('Error fetching OpenAI API key from settings:', err);
  }
  
  throw new Error('OpenAI API key not found in environment variables or settings');
};

// Function to generate a caption using OpenAI with RAG from dealer and vehicle information
export const generateCaption = async (
  vehicle: Vehicle,
  dealership?: Dealership | null,
  additionalContext?: string
): Promise<string> => {
  try {
    const apiKey = await getOpenAIApiKey();
    
    // Get dealership onboarding data for enhanced prompts
    const onboardingData = dealership ? await getOnboardingData(dealership.id) : null;
    
    // Build the prompt with RAG from dealer and vehicle information
    const prompt = await buildPrompt(vehicle, dealership, onboardingData, additionalContext);
    
    // Log the prompt to console for debugging
    console.log('OpenAI Caption Generation Prompt:', prompt);
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator for car dealerships. Create engaging, concise captions for social media posts about vehicles. Include relevant hashtags. Keep the tone friendly and professional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up the content by removing leading/trailing quotes
    content = content.trim();
    if ((content.startsWith('"') && content.endsWith('"')) || 
        (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1).trim();
    }
    
    return content;
  } catch (err) {
    console.error('Error generating caption with OpenAI:', err);
    throw err;
  }
};

// Interface for onboarding data
interface OnboardingData {
  profile: DealershipProfile | null;
  brandVoice: BrandVoiceSettings | null;
  lifecycleTemplates: LifecycleTemplate[];
  differentiators: CompetitiveDifferentiator[];
  exampleCaptions: ExampleCaption[];
}

// Function to get onboarding data for a dealership
const getOnboardingData = async (dealershipId: number): Promise<OnboardingData> => {
  try {
    const [profile, brandVoice, lifecycleTemplates, differentiators, exampleCaptions] = await Promise.all([
      dealerOnboardingApi.getDealershipProfile(dealershipId),
      dealerOnboardingApi.getBrandVoiceSettings(dealershipId),
      dealerOnboardingApi.getLifecycleTemplates(dealershipId),
      dealerOnboardingApi.getCompetitiveDifferentiators(dealershipId),
      dealerOnboardingApi.getExampleCaptions(dealershipId)
    ]);
    
    return {
      profile,
      brandVoice,
      lifecycleTemplates,
      differentiators,
      exampleCaptions
    };
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return {
      profile: null,
      brandVoice: null,
      lifecycleTemplates: [],
      differentiators: [],
      exampleCaptions: []
    };
  }
};

// Helper function to build the prompt with RAG
const buildPrompt = async (
  vehicle: Vehicle,
  dealership?: Dealership | null,
  onboardingData?: OnboardingData | null,
  additionalContext?: string
): Promise<string> => {
  let prompt = 'Create a social media caption for the following vehicle:\n\n';
  
  // Add vehicle information
  prompt += `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}\n`;
  // Note: Color is excluded per user request
  if (vehicle.mileage) prompt += `Mileage: ${vehicle.mileage} miles\n`;
  // Only include price if vehicle status is ready_for_sale
  if (vehicle.price && vehicle.status === 'ready_for_sale') {
    prompt += `Price: $${vehicle.price.toLocaleString()}\n`;
  }
  if (vehicle.vin) prompt += `VIN: ${vehicle.vin}\n`;
  if (vehicle.stock_number) prompt += `Stock Number: ${vehicle.stock_number}\n`;
  if (vehicle.status) prompt += `Status: ${vehicle.status}\n`;
  
  // Add vehicle features if available
  if (vehicle.features && vehicle.features.length > 0) {
    prompt += `\nFeatures: ${vehicle.features.join(', ')}\n`;
  }
  
  // Add vehicle description if available
  if (vehicle.description) {
    prompt += `\nDescription: ${vehicle.description}\n`;
  }
  
  // Add enhanced dealership information from onboarding data
  if (onboardingData?.profile || dealership) {
    const profile = onboardingData?.profile;
    const fallbackDealership = dealership;
    
    prompt += `\nDealership Information:\n`;
    prompt += `Name: ${profile?.legal_name || profile?.dba_name || fallbackDealership?.name || 'Unknown'}\n`;
    
    if (profile?.physical_address) {
      prompt += `Location: ${profile.physical_address}\n`;
    } else if (fallbackDealership) {
      const location = `${fallbackDealership.city}, ${fallbackDealership.state} ${fallbackDealership.zip}`;
      prompt += `Location: ${location}\n`;
    }
    
    if (profile?.primary_phone || fallbackDealership?.phone) {
      prompt += `Phone: ${profile?.primary_phone || fallbackDealership?.phone}\n`;
    }
    
    if (profile?.website_url || fallbackDealership?.website) {
      prompt += `Website: ${profile?.website_url || fallbackDealership?.website}\n`;
    }
    
    if (profile?.years_in_business) {
      prompt += `Years in Business: ${profile.years_in_business}\n`;
    }
    
    if (profile?.dealership_type) {
      prompt += `Dealership Type: ${profile.dealership_type}\n`;
    }
  }
  
  // Add brand voice settings
  if (onboardingData?.brandVoice) {
    const brandVoice = onboardingData.brandVoice;
    prompt += `\nBrand Voice Guidelines:\n`;
    
    const formalityLevels = ['Very Casual', 'Casual', 'Balanced', 'Professional', 'Very Formal'];
    const energyLevels = ['Understated', 'Calm', 'Moderate', 'Energetic', 'High Energy'];
    
    prompt += `Formality Level: ${formalityLevels[brandVoice.formality_level - 1] || 'Balanced'} (${brandVoice.formality_level}/5)\n`;
    prompt += `Energy Level: ${energyLevels[brandVoice.energy_level - 1] || 'Moderate'} (${brandVoice.energy_level}/5)\n`;
    prompt += `Technical Detail Preference: ${brandVoice.technical_detail_preference}\n`;
    prompt += `Community Connection: ${brandVoice.community_connection}\n`;
    prompt += `Emoji Usage Level: ${brandVoice.emoji_usage_level}/5\n`;
    
    if (brandVoice.primary_emotions && brandVoice.primary_emotions.length > 0) {
      prompt += `Primary Emotions to Evoke: ${brandVoice.primary_emotions.join(', ')}\n`;
    }
    
    if (brandVoice.value_propositions && brandVoice.value_propositions.length > 0) {
      prompt += `Key Value Propositions: ${brandVoice.value_propositions.join(', ')}\n`;
    }
    
    if (brandVoice.tone_keywords && brandVoice.tone_keywords.length > 0) {
      prompt += `Tone Keywords to Use: ${brandVoice.tone_keywords.join(', ')}\n`;
    }
    
    if (brandVoice.avoid_tone_keywords && brandVoice.avoid_tone_keywords.length > 0) {
      prompt += `Tone Keywords to Avoid: ${brandVoice.avoid_tone_keywords.join(', ')}\n`;
    }
  }
  
  // Add competitive differentiators
  if (onboardingData?.differentiators && onboardingData.differentiators.length > 0) {
    prompt += `\nCompetitive Differentiators to Highlight:\n`;
    onboardingData.differentiators
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3) // Top 3 differentiators
      .forEach(diff => {
        prompt += `- ${diff.title}: ${diff.description}\n`;
      });
  }
  
  // Add lifecycle template example based on vehicle status
  if (onboardingData?.lifecycleTemplates && onboardingData.lifecycleTemplates.length > 0) {
    const statusToLifecycle: { [key: string]: string } = {
      'acquired': 'acquisition',
      'in_service': 'service',
      'ready_for_sale': 'ready_for_sale',
      'sold': 'delivery'
    };
    
    const lifecycleStage = statusToLifecycle[vehicle.status] || 'ready_for_sale';
    const relevantTemplate = onboardingData.lifecycleTemplates.find(
      template => template.lifecycle_stage === lifecycleStage && template.is_active
    );
    
    if (relevantTemplate) {
      prompt += `\nLifecycle Template Example for ${lifecycleStage}:\n`;
      prompt += `"${relevantTemplate.template_content}"\n`;
      prompt += `Use this as inspiration for the tone and structure, but customize it for the specific vehicle.\n`;
    }
  }
  
  // Add example captions for reference
  if (onboardingData?.exampleCaptions && onboardingData.exampleCaptions.length > 0) {
    const statusToLifecycle: { [key: string]: string } = {
      'acquired': 'acquisition',
      'in_service': 'service',
      'ready_for_sale': 'ready_for_sale',
      'sold': 'delivery'
    };
    
    const lifecycleStage = statusToLifecycle[vehicle.status] || 'ready_for_sale';
    const relevantExamples = onboardingData.exampleCaptions.filter(
      caption => caption.lifecycle_stage === lifecycleStage
    );
    
    if (relevantExamples.length > 0) {
      prompt += `\nExample Captions for ${lifecycleStage} stage:\n`;
      relevantExamples.slice(0, 2).forEach((example, index) => {
        prompt += `Example ${index + 1}: "${example.caption_text}"\n`;
      });
      prompt += `Use these examples as style references, but create original content.\n`;
    }
  }
  
  // Add additional context if provided - prioritize notes as the main focus
  if (additionalContext && additionalContext.trim()) {
    // Check if this contains specific notes (indicated by "Specific details:" prefix)
    if (additionalContext.includes('Specific details:')) {
      const parts = additionalContext.split('Specific details:');
      const baseContext = parts[0]?.trim();
      const specificNotes = parts[1]?.trim();
      
      if (specificNotes) {
        prompt += `\n🎯 PRIMARY FOCUS - CENTRAL THEME:\n`;
        prompt += `The social media post MUST revolve around and highlight: ${specificNotes}\n`;
        prompt += `This should be the main story and central focus of the entire caption.\n`;
        
        if (baseContext) {
          prompt += `\nSupporting Context: ${baseContext}\n`;
        }
      } else if (baseContext) {
        prompt += `\nAdditional Context: ${baseContext}\n`;
      }
    } else {
      prompt += `\nAdditional Context: ${additionalContext}\n`;
    }
  }
  
  // Add enhanced instructions for the caption
  prompt += `\nInstructions:\n`;
  
  // Check if there are specific notes to focus on
  const hasSpecificNotes = additionalContext && additionalContext.includes('Specific details:');
  
  if (hasSpecificNotes) {
    prompt += `🎯 CRITICAL: The caption MUST be centered around and primarily focus on the specific details mentioned in the PRIMARY FOCUS section above. `;
    prompt += `Build the entire narrative around that central theme. The vehicle details should support this main story, not overshadow it. `;
    prompt += `Make the specific details the hero of the post. `;
  } else {
    prompt += `Create an engaging, concise caption for a social media post about this vehicle. `;
  }
  
  prompt += `Follow the brand voice guidelines above and incorporate the competitive differentiators where relevant. `;
  prompt += `Use the lifecycle template and example captions as inspiration for tone and structure. `;
  prompt += `Include relevant hashtags that align with the dealership's brand. `;
  
  if (hasSpecificNotes) {
    prompt += `Remember: The specific details mentioned should be the main focus and story of the caption. `;
  }
  
  prompt += `Keep it concise but impactful, suitable for Facebook and Instagram.`;
  
  return prompt;
};

// Function to check if OpenAI API is configured
export const isOpenAIConfigured = async (): Promise<boolean> => {
  try {
    await getOpenAIApiKey();
    return true;
  } catch (err) {
    return false;
  }
};
