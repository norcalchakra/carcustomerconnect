import React, { useState, useEffect } from 'react';
import { DealershipProfile } from '../../lib/dealerOnboardingTypes';
import './OnboardingSteps.css';

interface BusinessProfileStepProps {
  onSave: (profile: DealershipProfile) => void;
  profile: DealershipProfile | null;
  dealershipId: number | null;
}

const BusinessProfileStep: React.FC<BusinessProfileStepProps> = ({ onSave, profile, dealershipId }) => {
  const [formData, setFormData] = useState<DealershipProfile>({
    id: dealershipId || 0,
    legal_name: '',
    dba_name: '',
    primary_phone: '',
    service_phone: '',
    website_url: '',
    physical_address: '',
    google_maps_plus_code: '',
    years_in_business: 0,
    dealership_type: 'independent',
    primary_market_radius: 0,
    updated_at: new Date().toISOString()
  });
  const [error, setError] = useState<string | null>(null);
  const [brandsCarried, setBrandsCarried] = useState<string[]>([]);

  // Load existing profile data if available
  useEffect(() => {
    if (profile) {
      setFormData(profile);
      
      // Handle brands carried separately since it's not in the interface
      // but we track it for UI purposes
      if (profile.brands_carried && Array.isArray(profile.brands_carried)) {
        setBrandsCarried(profile.brands_carried as string[]);
      }
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'brands_carried') {
      // Handle brands as a comma-separated list
      setBrandsCarried(value.split(',').map(brand => brand.trim()));
    } else if (name === 'years_in_business' || name === 'primary_market_radius') {
      // Convert numeric fields
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else {
      // Handle all other fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save the profile data with the updated timestamp
    // Note: brandsCarried is stored separately as it's not part of the DealershipProfile interface
    onSave({
      ...formData,
      updated_at: new Date().toISOString()
    });
    
    // You might want to store brandsCarried in a separate table or as metadata
    console.log('Brands carried:', brandsCarried);
  };

  return (
    <div className="onboarding-step business-profile-step">
      <h2>Business Profile</h2>
      <p className="step-description">
        Tell us about your dealership. This information will be used to personalize your AI-generated content.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="legal_name">Legal Business Name*</label>
            <input
              type="text"
              id="legal_name"
              name="legal_name"
              value={formData.legal_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dba_name">Marketing/DBA Name</label>
            <input
              type="text"
              id="dba_name"
              name="dba_name"
              value={formData.dba_name || ''}
              onChange={handleChange}
              placeholder="If different from legal name"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="physical_address">Street Address*</label>
            <input
              type="text"
              id="physical_address"
              name="physical_address"
              value={formData.physical_address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="google_maps_plus_code">Google Maps Plus Code</label>
            <input
              type="text"
              id="google_maps_plus_code"
              name="google_maps_plus_code"
              value={formData.google_maps_plus_code || ''}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primary_phone">Primary Phone*</label>
            <input
              type="tel"
              id="primary_phone"
              name="primary_phone"
              value={formData.primary_phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="service_phone">Service Phone</label>
            <input
              type="tel"
              id="service_phone"
              name="service_phone"
              value={formData.service_phone || ''}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website_url">Website URL</label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formData.website_url || ''}
              onChange={handleChange}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="years_in_business">Years in Business</label>
            <input
              type="number"
              id="years_in_business"
              name="years_in_business"
              value={formData.years_in_business}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dealership_type">Dealership Type*</label>
            <select
              id="dealership_type"
              name="dealership_type"
              value={formData.dealership_type}
              onChange={handleChange}
              required
            >
              <option value="new">New Vehicles</option>
              <option value="used">Used Vehicles</option>
              <option value="both">New & Used Vehicles</option>
              <option value="specialty">Specialty Vehicles</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="primary_market_radius">Market Radius (miles)</label>
            <input
              type="number"
              id="primary_market_radius"
              name="primary_market_radius"
              value={formData.primary_market_radius || 0}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="brands_carried">Brands Carried (comma-separated)</label>
            <input
              type="text"
              id="brands_carried"
              name="brands_carried"
              value={brandsCarried.join(', ')}
              onChange={handleChange}
              placeholder="e.g. Toyota, Honda, Ford"
            />
          </div>
        </div>

        {/* AI suggestions removed as per request */}

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

export default BusinessProfileStep;
