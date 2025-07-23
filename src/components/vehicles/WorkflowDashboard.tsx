import React, { useState, useEffect } from 'react';
import { Vehicle, vehiclesApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import VehicleProgressTracker from './VehicleProgressTracker';
import SocialPostFormEnhanced from '../captions/SocialPostFormEnhanced';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import './WorkflowDashboard.css';

interface WorkflowDashboardProps {
  onVehicleUpdate?: (vehicle: Vehicle) => void;
}

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ onVehicleUpdate }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<Vehicle['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'progress'>('date');

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
      
      setLoading(true);
      try {
        const fetchedVehicles = await vehiclesApi.getAll(dealershipId);
        setVehicles(fetchedVehicles || []);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [dealershipId]);

  const handleStatusChange = async (vehicleId: number, newStatus: Vehicle['status']) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedVehicle = await vehiclesApi.update(vehicleId, {
        ...vehicle,
        status: newStatus
      });

      if (updatedVehicle) {
        setVehicles(prev => prev.map(v => 
          v.id === vehicleId ? updatedVehicle : v
        ));
        
        if (onVehicleUpdate) {
          onVehicleUpdate(updatedVehicle);
        }
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      setError('Failed to update vehicle status');
    }
  };

  const handleSuggestedAction = (vehicle: Vehicle, action: string) => {
    setSelectedVehicle(vehicle);
    
    // Handle different suggested actions
    switch (action) {
      case 'Take arrival photos':
      case 'Create acquisition post':
      case 'Document service work':
      case 'Share service updates':
      case 'Take final photos':
      case 'Create sales post':
      case 'Customer delivery post':
        // Open social post modal for photo/posting actions
        setShowPostModal(true);
        break;
      case 'Schedule inspection':
      case 'Complete final inspection':
      case 'Update inventory':
      case 'Request review':
        // Handle other actions (could open different modals or forms)
        console.log(`Action: ${action} for vehicle:`, vehicle);
        // For now, just log - you could implement specific handlers
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const getStatusStats = () => {
    const stats = {
      acquired: vehicles.filter(v => v.status === 'acquired').length,
      in_service: vehicles.filter(v => v.status === 'in_service').length,
      ready_for_sale: vehicles.filter(v => v.status === 'ready_for_sale').length,
      sold: vehicles.filter(v => v.status === 'sold').length
    };
    return stats;
  };

  const getFilteredAndSortedVehicles = () => {
    let filtered = vehicles;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus);
    }
    
    // Sort vehicles
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'status':
          const statusOrder = ['acquired', 'in_service', 'ready_for_sale', 'sold'];
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        case 'progress':
          const progressOrder = ['acquired', 'in_service', 'ready_for_sale', 'sold'];
          return progressOrder.indexOf(b.status) - progressOrder.indexOf(a.status);
        default:
          return 0;
      }
    });
  };

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const getDaysInStatus = (vehicle: Vehicle) => {
    const createdDate = new Date(vehicle.created_at || Date.now());
    const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const stats = getStatusStats();
  const filteredVehicles = getFilteredAndSortedVehicles();

  if (loading) {
    return (
      <div className="workflow-dashboard loading">
        <div className="loading-spinner">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div className="workflow-dashboard">
      <div className="dashboard-header">
        <h2>Vehicle Workflow Dashboard</h2>
        <p className="dashboard-subtitle">
          Track your vehicles through the reconditioning journey
        </p>
      </div>

      {/* Status Overview */}
      <div className="status-overview">
        <div className="stat-card acquired">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.acquired}</div>
            <div className="stat-label">Acquired</div>
          </div>
        </div>
        
        <div className="stat-card in-service">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-number">{stats.in_service}</div>
            <div className="stat-label">In Service</div>
          </div>
        </div>
        
        <div className="stat-card ready-for-sale">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <div className="stat-number">{stats.ready_for_sale}</div>
            <div className="stat-label">Ready for Sale</div>
          </div>
        </div>
        
        <div className="stat-card sold">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <div className="stat-number">{stats.sold}</div>
            <div className="stat-label">Sold</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="dashboard-controls">
        <div className="filter-section">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Vehicle['status'] | 'all')}
          >
            <option value="all">All Vehicles</option>
            <option value="acquired">Acquired</option>
            <option value="in_service">In Service</option>
            <option value="ready_for_sale">Ready for Sale</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        
        <div className="sort-section">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'progress')}
          >
            <option value="date">Date Added</option>
            <option value="status">Status</option>
            <option value="progress">Progress</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Vehicle Progress Cards */}
      <div className="vehicles-grid">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3>No vehicles found</h3>
            <p>
              {filterStatus === 'all' 
                ? 'Add your first vehicle to get started with the workflow.'
                : `No vehicles with status "${filterStatus}".`
              }
            </p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-workflow-card">
              <VehicleProgressTracker
                vehicle={vehicle}
                onStatusChange={(newStatus) => handleStatusChange(vehicle.id, newStatus)}
                onSuggestedAction={(action) => handleSuggestedAction(vehicle, action)}
              />
              
              <div className="vehicle-quick-actions">
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setShowPostModal(true);
                  }}
                  className="quick-action-button post-button"
                >
                  📱 Create Post
                </button>
                
                <div className="vehicle-meta">
                  <span className="days-in-status">
                    {getDaysInStatus(vehicle)} days in current status
                  </span>
                  <span className="stock-number">
                    Stock #{vehicle.stock_number}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Social Post Modal */}
      {showPostModal && selectedVehicle && (
        <Modal
          isOpen={showPostModal}
          onClose={() => {
            setShowPostModal(false);
            setSelectedVehicle(null);
          }}
          title={`Create Post - ${getVehicleDisplayName(selectedVehicle)}`}
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
              if (onVehicleUpdate) {
                onVehicleUpdate(updatedVehicle);
              }
            }}
            onPost={() => {
              setShowPostModal(false);
              setSelectedVehicle(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default WorkflowDashboard;
