import React, { useState, useEffect } from 'react';
import { Vehicle, vehiclesApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import SocialPostFormEnhanced from '../captions/SocialPostFormEnhanced';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import './SocialPostCreationPage.css';

const SocialPostCreationPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch dealership ID
  useEffect(() => {
    const getDealershipId = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('dealerships')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          setDealershipId(data.id);
        }
      } catch (err) {
        console.error('Error fetching dealership:', err);
      }
    };
    
    getDealershipId();
  }, [user]);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!dealershipId) return;
      
      try {
        setLoading(true);
        const fetchedVehicles = await vehiclesApi.getAll(dealershipId);
        setVehicles(fetchedVehicles);
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to load vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [dealershipId]);

  const getVehicleDisplayName = (vehicle: Vehicle): string => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    const displayName = getVehicleDisplayName(vehicle).toLowerCase();
    const vin = vehicle.vin?.toLowerCase() || '';
    const status = vehicle.status?.toLowerCase() || '';
    return displayName.includes(searchTerm.toLowerCase()) || 
           vin.includes(searchTerm.toLowerCase()) ||
           status.includes(searchTerm.toLowerCase());
  });

  const handleCreatePost = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowPostModal(true);
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setSelectedVehicle(null);
  };

  const handlePostSuccess = () => {
    setShowPostModal(false);
    setSelectedVehicle(null);
    // Optionally refresh vehicles or show success message
  };

  if (loading) {
    return (
      <div className="social-post-creation-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="social-post-creation-page">
      <div className="page-header">
        <h1>Create Social Media Post</h1>
        <p>Select a vehicle to create a social media post</p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search vehicles by make, model, VIN, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Vehicle Selection Grid */}
      <div className="vehicles-grid">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3>No vehicles found</h3>
            <p>
              {searchTerm 
                ? `No vehicles match "${searchTerm}". Try adjusting your search.`
                : 'Add your first vehicle to start creating social media posts.'
              }
            </p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-info">
                <h3 className="vehicle-name">{getVehicleDisplayName(vehicle)}</h3>
                <div className="vehicle-details">
                  <span className="vehicle-vin">VIN: {vehicle.vin || 'N/A'}</span>
                  <span className={`vehicle-status status-${vehicle.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {vehicle.status || 'Unknown'}
                  </span>
                </div>
                {vehicle.mileage && (
                  <div className="vehicle-mileage">
                    {vehicle.mileage.toLocaleString()} miles
                  </div>
                )}
              </div>
              <div className="vehicle-actions">
                <button
                  className="create-post-btn"
                  onClick={() => handleCreatePost(vehicle)}
                >
                  📱 Create Post
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Social Post Modal - Matches Workflow Dashboard */}
      {showPostModal && selectedVehicle && (
        <Modal
          isOpen={showPostModal}
          onClose={handleCloseModal}
          title={`Create Post - ${getVehicleDisplayName(selectedVehicle)}`}
          size="lg"
        >
          <SocialPostFormEnhanced
            caption={{ 
              id: 0, 
              content: '', 
              vehicle_id: selectedVehicle.id, 
              event_id: 0,
              hashtags: [],
              created_at: new Date().toISOString()
            }}
            vehicle={selectedVehicle}
            onVehicleStatusChange={(updatedVehicle) => {
              setVehicles(prev => prev.map(v => 
                v.id === updatedVehicle.id ? updatedVehicle : v
              ));
            }}
            onPost={handlePostSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

export default SocialPostCreationPage;
