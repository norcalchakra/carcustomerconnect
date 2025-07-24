import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import VehicleForm from './vehicles/VehicleForm';
import Modal from './ui/Modal';
import { SocialPostFormEnhanced } from './captions/SocialPostFormEnhanced';
import FacebookCredentialsTest from './FacebookCredentialsTest';

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
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);



  const [recentActivity, setRecentActivity] = useState<(RecentActivity & { imageUrl?: string })[]>([]);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 5;

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
      // Fetch more items than we display per page to have data for pagination
      const activity = await fetchAllActivity(dealershipId, 50);
      console.log('Activity fetched:', activity);
      setRecentActivity(activity);
      
      // Calculate total pages
      setTotalPages(Math.max(1, Math.ceil(activity.length / itemsPerPage)));
      // Reset to first page when refreshing data
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  }, [dealershipId, itemsPerPage]);

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



  const handleVehicleSaved = () => {
    setIsAddVehicleModalOpen(false);
    // Vehicle saved successfully - user can view it in the workflow dashboard
    refreshActivity(); // Refresh the activity feed to show the new vehicle
  };



  return (
    <div className="p-4">
      <div className="dashboard-card quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/workflow" className="action-button workflow-highlight">
            <span className="action-icon">🔄</span>
            <span className="action-label">Vehicle Workflow</span>
          </Link>

          <button className="action-button" onClick={() => setIsAddVehicleModalOpen(true)}>
            <span className="action-icon">+</span>
            <span className="action-label">Add Vehicle</span>
          </button>

          <button className="action-button" onClick={() => setIsCreatePostModalOpen(true)}>
            <span className="action-icon">📝</span>
            <span className="action-label">Create Post</span>
          </button>
        </div>
      </div>

      {/* Facebook Integration Test - Only for testing credentials */}
      <FacebookCredentialsTest />

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
            <>
              <ul className="activity-list">
                {/* Show only items for the current page */}
                {recentActivity
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((activity) => (
                    <li key={String(activity.id)} className="activity-item">
                      <div className="activity-header">
                        <span className="activity-status">{activity.status}</span>
                        <span className="activity-time">{activity.time}</span>
                      </div>

                      <div className="activity-vehicle">
                        {activity.isGenericPost ? (
                          <Link to="/activity">
                            {activity.vehicle}
                          </Link>
                        ) : (
                          <Link to={`/workflow/${activity.vehicleId}`}>
                            {activity.vehicle}
                          </Link>
                        )}
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
              
              {/* Pagination controls */}
              {recentActivity.length > 0 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {Math.min(recentActivity.length, (currentPage - 1) * itemsPerPage + 1)}-
                    {Math.min(recentActivity.length, currentPage * itemsPerPage)} of {recentActivity.length}
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      className="pagination-button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Previous
                    </button>
                    <span className="pagination-page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      className="pagination-button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Next
                    </button>
                  </div>
                  <button 
                    className="view-all-button"
                    onClick={() => window.open('/activity', '_blank')}
                  >
                    View All Activity
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>



      <div className="dashboard-card performance-metrics coming-soon">
        <div className="section-header">
          <h2>Performance Metrics</h2>
          <span className="coming-soon-badge">Coming Soon</span>
        </div>
        <div className="metrics-grid disabled">
          <div className="metric-card">
            <div className="metric-value">47</div>
            <div className="metric-label">Vehicles in Stock</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">23</div>
            <div className="metric-label">Social Posts</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">1,284</div>
            <div className="metric-label">Total Engagements</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">12</div>
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

      {/* Create Post Modal */}
      <Modal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        title="Create Social Media Post"
        size="lg"
      >
        <SocialPostFormEnhanced
            caption={{
              id: 0,
              vehicle_id: 0, // Vehicle-agnostic post
              event_id: 0,
              content: '',
              hashtags: [],
              created_at: new Date().toISOString(),
              image_urls: [],
              posted_to_facebook: false,
              posted_to_instagram: false
            }}
          onPost={(platforms) => {
            console.log('Posted to platforms:', platforms);
            setIsCreatePostModalOpen(false);
            refreshActivity(); // Refresh activity feed
          }}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
