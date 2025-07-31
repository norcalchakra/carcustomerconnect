/**
 * Type definitions for the dealer onboarding system
 * These interfaces correspond to the database schema and are used for form handling
 */

export interface DealershipProfile {
  id: number;
  legal_name: string;
  dba_name?: string;
  primary_phone: string;
  service_phone?: string;
  website_url?: string;
  physical_address: string;
  google_maps_plus_code?: string;
  years_in_business?: number;
  dealership_type: 'independent' | 'franchise' | 'specialty' | string;
  primary_market_radius?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BrandVoiceSettings {
  id: number; // Primary key AND foreign key to dealerships(id)
  formality_level: number; // 1-5 scale (casual to formal)
  energy_level: number; // 1-5 scale (understated to high energy)
  technical_detail_preference: 'feature-heavy' | 'benefit-focused' | 'lifestyle-oriented';
  community_connection: 'hyper-local' | 'regional' | 'universal';
  emoji_usage_level: number; // 1-5 scale (none to abundant)
  primary_emotions?: string[]; // Array of emotions to evoke 
  value_propositions?: string[]; // Array of key value propositions
  tone_keywords?: string[]; // Array of tone keywords to use
  avoid_tone_keywords?: string[]; // Array of tone keywords to avoid
  example_phrases?: string[]; // Array of example phrases
  created_at?: string;
  updated_at?: string;
}

export interface LifecycleTemplate {
  id?: number;
  dealership_id: number;
  lifecycle_stage: 'acquisition' | 'service' | 'ready_for_sale' | 'delivery';
  template_name: string;
  template_content: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompetitiveDifferentiator {
  id: number;
  dealership_id: number;
  category: 'service' | 'customer_experience' | 'financial' | 'inventory' | 'warranty' | 'community' | 'other';
  title: string;
  description: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContentGovernance {
  id: number;
  never_mention: string[];
  always_include: string[];
  content_guidelines?: string;
  hashtag_strategy: {
    branded: string[];
    location: string[];
    vehicle: string[];
    lifestyle: string[];
    limit_per_post: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ExampleCaption {
  id?: number;
  dealership_id: number;
  vehicle_type?: string;
  price_range?: string;
  lifecycle_stage: 'acquisition' | 'service' | 'ready_for_sale' | 'delivery';
  caption_text: string;
  caption_type?: string;
  platform?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Individual technical integration item
export interface TechnicalIntegration {
  id?: number;
  system: string;
  integration_type: string;
  api_key?: string;
  enabled: boolean;
}

// Customization parameters
export interface CustomizationParameters {
  id?: number;
  dealership_id: number;
  theme_colors?: string[];
  logo_url?: string;
  custom_fields?: Record<string, any>;
  preferences?: Record<string, any>;
  seasonal_adaptations?: Record<string, any>;
  vehicle_type_preferences?: Record<string, any>;
  price_range_messaging?: Record<string, any>;
  compliance_templates?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface TechnicalIntegrations {
  id: number;
  dms_integration?: {
    system: string;
    integration_type: string;
    api_key?: string;
  };
  website_platform?: string;
  social_media_tools?: {
    facebook?: boolean;
    instagram?: boolean;
    twitter?: boolean;
    other?: string[];
  };
  photo_management_system?: string;
  crm_preferences?: {
    system: string;
    sync_frequency: string;
  };
  workflow_preferences?: {
    approval_required: boolean;
    posting_times: string[];
    departments_involved: string[];
  };
  created_at?: string;
  updated_at?: string;
}

// Complete onboarding state that combines all sections
export interface DealerOnboardingState {
  profile: DealershipProfile | null;
  brandVoice: BrandVoiceSettings | null;
  lifecycleTemplates: LifecycleTemplate[];
  differentiators: CompetitiveDifferentiator[];
  contentGovernance: ContentGovernance | null;
  technicalIntegrations: TechnicalIntegrations | null;
  currentStep: number;
  completedSteps: number[];
}

// Onboarding progress tracking
export interface OnboardingProgress {
  dealership_id: number;
  completed_sections: string[];
  current_section: string;
  completion_percentage: number;
  last_updated: string;
}

// AI suggestion request interface
export interface AISuggestionRequest {
  dealership_id: number;
  section: string;
  current_data?: any;
  prompt?: string;
}

// AI suggestion response interface
export interface AISuggestionResponse {
  suggestions: any;
  explanation?: string;
  alternative_options?: any[];
}
