-- Dealer Onboarding Schema for Car Customer Connect
-- This schema supports the comprehensive dealer onboarding process
-- and provides data for RAG (Retrieval Augmented Generation)

-- Core dealership profile information
CREATE TABLE IF NOT EXISTS dealership_profiles (
    id BIGINT PRIMARY KEY REFERENCES dealerships(id),
    legal_name TEXT NOT NULL,
    dba_name TEXT,
    primary_phone TEXT,
    service_phone TEXT,
    website_url TEXT,
    physical_address TEXT,
    google_maps_plus_code TEXT,
    years_in_business INTEGER,
    dealership_type TEXT, -- Independent, franchise, specialty
    primary_market_radius INTEGER, -- in miles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand voice configuration
CREATE TABLE IF NOT EXISTS brand_voice_settings (
    id BIGINT PRIMARY KEY REFERENCES dealerships(id),
    formality_level INTEGER NOT NULL, -- 1-5 scale (casual to formal)
    energy_level INTEGER NOT NULL, -- 1-5 scale (understated to high energy)
    technical_detail_preference TEXT NOT NULL, -- feature-heavy, benefit-focused, lifestyle-oriented
    community_connection TEXT NOT NULL, -- hyper-local, regional, universal
    emoji_usage_level INTEGER NOT NULL, -- 1-5 scale (none to abundant)
    primary_emotions TEXT[] DEFAULT '{}', -- Array of emotions to evoke
    value_propositions TEXT[] DEFAULT '{}', -- Array of key value propositions
    tone_keywords TEXT[] DEFAULT '{}', -- Array of tone keywords to use
    avoid_tone_keywords TEXT[] DEFAULT '{}', -- Array of tone keywords to avoid
    example_phrases TEXT[] DEFAULT '{}', -- Array of example phrases
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lifecycle stage templates
CREATE TABLE IF NOT EXISTS lifecycle_templates (
    id BIGSERIAL PRIMARY KEY,
    dealership_id BIGINT REFERENCES dealerships(id),
    lifecycle_stage TEXT NOT NULL, -- acquisition, service, ready_for_sale, delivery
    template_name TEXT NOT NULL,
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced customization parameters
CREATE TABLE IF NOT EXISTS customization_parameters (
    id BIGINT PRIMARY KEY REFERENCES dealerships(id),
    seasonal_adaptations JSONB, -- JSON object with season-specific messaging preferences
    vehicle_type_preferences JSONB, -- JSON object with preferences by vehicle type
    price_range_messaging JSONB, -- JSON object with messaging by price range
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive differentiators
CREATE TABLE IF NOT EXISTS competitive_differentiators (
    id BIGSERIAL PRIMARY KEY,
    dealership_id BIGINT REFERENCES dealerships(id),
    category TEXT NOT NULL, -- service, customer_experience, financial
    differentiator TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content governance rules
CREATE TABLE IF NOT EXISTS content_governance (
    id BIGINT PRIMARY KEY REFERENCES dealerships(id),
    never_mention JSONB, -- Array of terms to avoid
    always_include JSONB, -- Array of elements to always include
    hashtag_strategy JSONB, -- JSON object with hashtag preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example captions for RAG training
CREATE TABLE IF NOT EXISTS example_captions (
    id BIGSERIAL PRIMARY KEY,
    dealership_id BIGINT REFERENCES dealerships(id),
    vehicle_type TEXT, -- sedan, suv, truck, etc.
    price_range TEXT, -- budget, mid-range, premium
    lifecycle_stage TEXT NOT NULL, -- acquisition, service, ready_for_sale, delivery
    caption_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical integration preferences
CREATE TABLE IF NOT EXISTS technical_integrations (
    id BIGINT PRIMARY KEY REFERENCES dealerships(id),
    dms_integration JSONB,
    website_platform TEXT,
    social_media_tools JSONB,
    photo_management_system TEXT,
    crm_preferences JSONB,
    workflow_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
-- Ensure dealerships can only access their own onboarding data
ALTER TABLE dealership_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifecycle_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_differentiators ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE example_captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for each table (safely checking if they exist first)
DO $$ 
BEGIN
    -- Check if dealership_profiles_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'dealership_profiles_policy'
    ) THEN
        CREATE POLICY dealership_profiles_policy ON dealership_profiles
            USING (id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if brand_voice_settings_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'brand_voice_settings_policy'
    ) THEN
        CREATE POLICY brand_voice_settings_policy ON brand_voice_settings
            USING (id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if lifecycle_templates_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'lifecycle_templates_policy'
    ) THEN
        CREATE POLICY lifecycle_templates_policy ON lifecycle_templates
            USING (dealership_id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if customization_parameters_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'customization_parameters_policy'
    ) THEN
        CREATE POLICY customization_parameters_policy ON customization_parameters
            USING (id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if competitive_differentiators_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'competitive_differentiators_policy'
    ) THEN
        CREATE POLICY competitive_differentiators_policy ON competitive_differentiators
            USING (dealership_id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if content_governance_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'content_governance_policy'
    ) THEN
        CREATE POLICY content_governance_policy ON content_governance
            USING (id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if example_captions_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'example_captions_policy'
    ) THEN
        CREATE POLICY example_captions_policy ON example_captions
            USING (dealership_id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;

    -- Check if technical_integrations_policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'technical_integrations_policy'
    ) THEN
        CREATE POLICY technical_integrations_policy ON technical_integrations
            USING (id IN (
                SELECT id FROM dealerships WHERE user_id = auth.uid()
            ));
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS lifecycle_templates_dealership_id_idx ON lifecycle_templates(dealership_id);
CREATE INDEX IF NOT EXISTS competitive_differentiators_dealership_id_idx ON competitive_differentiators(dealership_id);
CREATE INDEX IF NOT EXISTS example_captions_dealership_id_idx ON example_captions(dealership_id);
CREATE INDEX IF NOT EXISTS example_captions_lifecycle_stage_idx ON example_captions(lifecycle_stage);
