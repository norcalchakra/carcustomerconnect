import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VehicleList from './vehicles/VehicleList';
import VehicleForm from './vehicles/VehicleForm';
import Modal from './ui/Modal';
import Debug from './Debug';
import { Vehicle } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { fetchAllActivity, RecentActivity } from '../lib/activityService';
import eventBus, { EVENTS } from '../lib/eventBus';
import { supabase } from '../lib/supabase';
import './Dashboard.improved.css';

interface DashboardProps {}

// Define the ref interface for external components that need to refresh the dashboard
export interface DashboardRefHandle {
  refreshActivity: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuth();
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentActivity, setRecentActivity] = useState<(RecentActivity & { imageUrl?: string })[]>([]);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dealership ID for the current user
  useEffect(() => {
    const getDealershipId = async () => {
      if (!user) {
        setError('User not authenticated');
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
      }
    };

    getDealershipId();
  }, [user]);

  // Fetch vehicles for the dealership
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!dealershipId) return;
      
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('dealership_id', dealershipId);
          
        if (error) throw error;
        if (data) setVehicles(data as Vehicle[]);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      }
    };
    
    fetchVehicles();
  }, [dealershipId]);

  // Function to refresh activity data
  const refreshActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!dealershipId) {
        setLoading(false);
        return;
      }

      console.log('Fetching activity for dealership:', dealershipId);
      const activity = await fetchAllActivity(dealershipId);
      console.log('Activity fetched:', activity);
      setRecentActivity(activity);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  }, [dealershipId]);

  // Handle viewing post details
  const navigate = useNavigate();
  
  const handleViewPostDetails = (postId: string | number) => {
    // Extract the numeric ID if it's a prefixed string ID (e.g., 'social_123' → '123')
    const numericId = typeof postId === 'string' ? postId.split('_')[1] : postId;
    navigate(`/social/posts/${numericId}`);
  };

  // No longer needed with React Router
  // const handleClosePostDetail = () => {
  //   setShowPostDetail(false);
  //   setSelectedPost(null);
  // };

  // Render platform badges for social posts
  const renderPlatformBadges = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) return null;

    return (
      <div className="platform-badges">
        {platforms.includes('facebook') && (
          <span className="platform-badge facebook">Facebook</span>
        )}
        {platforms.includes('instagram') && (
          <span className="platform-badge instagram">Instagram</span>
        )}
        {platforms.includes('google') && (
          <span className="platform-badge google">Google</span>
        )}
      </div>
    );
  };

  // Create a ref for refreshActivity that can be used by parent components
  const refreshActivityRef = useRef<() => Promise<void>>(refreshActivity);
  
  // Keep the ref updated with the latest refreshActivity function
  useEffect(() => {
    refreshActivityRef.current = refreshActivity;
  }, [refreshActivity]);

  // Fetch recent activity on component mount
  useEffect(() => {
    if (dealershipId) {
      refreshActivity();
    }

    // Listen for social post created events
    const handleSocialPostCreated = () => {
      console.log('Dashboard received social post created event, refreshing activity...');
      refreshActivity();
    };

    // Subscribe to events
    eventBus.on(EVENTS.SOCIAL_POST_CREATED, handleSocialPostCreated);
    eventBus.on(EVENTS.ACTIVITY_UPDATED, handleSocialPostCreated);

    // Cleanup event listeners
    return () => {
      eventBus.off(EVENTS.SOCIAL_POST_CREATED, handleSocialPostCreated);
      eventBus.off(EVENTS.ACTIVITY_UPDATED, handleSocialPostCreated);
    };
  }, [dealershipId, refreshActivity]);

  const handleAddVehicle = () => {
    setIsAddVehicleModalOpen(true);
  };

  const handleVehicleSaved = (vehicle: Vehicle) => {
    setIsAddVehicleModalOpen(false);
    navigate(`/vehicles/${vehicle.id}`);
  };

  return (
    <div className="p-4">
      {/* Debug Component - Shows dealership information */}
      <Debug />

      {/* Vehicle List with Status Filters */}
      <VehicleList
        onSelectVehicle={(vehicle) => navigate(`/vehicles/${vehicle.id}`)}
        onAddVehicle={handleAddVehicle}
      />

      <div className="dashboard-card recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-container">
          {loading ? (
            <div className="loading-indicator">Loading recent activity...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>No recent activity found.</p>
              <p>Start by adding vehicles or creating social media posts.</p>
            </div>
          ) : (
            <ul className="activity-list">
              {recentActivity.map((activity) => (
                <li key={String(activity.id)} className="activity-item">
                  <div className="activity-header">
                    <span className="activity-status">{activity.status}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>

                  <div className="activity-vehicle">
                    <Link to={`/vehicles/${activity.vehicleId}`}>
                      {activity.vehicle}
                    </Link>
                  </div>

                  <div className="activity-content">
                    {activity.isSocialPost ? (
                      <>
                        <div className="abbreviated-content">
                          {activity.notes && activity.notes.length > 60 
                            ? `${activity.notes.substring(0, 60)}...` 
                            : activity.notes}
                        </div>
                        <button
                          className="view-details-btn"
                          onClick={() => handleViewPostDetails(activity.id)}
                        >
                          View Full Post
                        </button>
                      </>
                    ) : (
                      <div>{activity.notes}</div>
                    )}
                  </div>

                  {activity.isSocialPost && renderPlatformBadges(activity.platforms)}

                  {activity.isSocialPost && activity.imageUrl && (
                    <div className="activity-image">
                      <img src={activity.imageUrl} alt="Post preview" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dashboard-card quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-button" onClick={() => setIsAddVehicleModalOpen(true)}>
            <span className="action-icon">+</span>
            <span className="action-label">Add Vehicle</span>
          </button>

          <Link to="/captions" className="action-button">
            <span className="action-icon">📝</span>
            <span className="action-label">Create Post</span>
          </Link>

          <Link to="/vehicles" className="action-button">
            <span className="action-icon">🚗</span>
            <span className="action-label">View Inventory</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-card performance-metrics">
        <h2>Performance Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{vehicles.length}</div>
            <div className="metric-label">Vehicles in Stock</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">{recentActivity.filter((a) => a.isSocialPost).length}</div>
            <div className="metric-label">Social Posts</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">142</div>
            <div className="metric-label">Total Engagements</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">5</div>
            <div className="metric-label">Vehicles Sold This Month</div>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Add New Vehicle"
        size="lg"
      >
        <VehicleForm
          onSave={handleVehicleSaved}
          onCancel={() => setIsAddVehicleModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
