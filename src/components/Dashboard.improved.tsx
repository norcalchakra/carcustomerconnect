import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllActivity, RecentActivity } from '../lib/activityService.improved';
import { SocialPostDetail } from './social/SocialPostDetail';
import eventBus, { EVENTS } from '../lib/eventBus';
import './Dashboard.css';

interface DashboardProps {
  dealershipId?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ dealershipId = 4 }) => {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [showPostDetail, setShowPostDetail] = useState<boolean>(false);
  
  const loadActivity = async () => {
    try {
      setLoading(true);
      const activity = await fetchAllActivity(dealershipId);
      setRecentActivity(activity);
      setError(null);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadActivity();
    
    // Listen for activity updates (e.g., when a new social post is created)
    const handleActivityUpdate = () => {
      console.log('Activity updated event received, refreshing activity feed');
      loadActivity();
    };
    
    eventBus.on(EVENTS.ACTIVITY_UPDATED, handleActivityUpdate);
    
    return () => {
      eventBus.off(EVENTS.ACTIVITY_UPDATED, handleActivityUpdate);
    };
  }, [dealershipId]);
  
  const handleViewPostDetails = (postId: number) => {
    setSelectedPost(postId);
    setShowPostDetail(true);
  };
  
  const handleClosePostDetail = () => {
    setShowPostDetail(false);
    setSelectedPost(null);
  };
  
  const renderPlatformBadges = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) return null;
    
    return (
      <div className="platform-badges">
        {platforms.map((platform, index) => (
          <span key={index} className={`platform-badge ${platform.toLowerCase()}`}>
            {platform === 'facebook' ? 'f' : platform === 'instagram' ? 'i' : 'g'}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="dashboard-card recent-activity">
          <h2>Recent Activity</h2>
          
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
                <li key={activity.id} className="activity-item">
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
                    {activity.notes}
                    
                    {activity.isSocialPost && (
                      <button 
                        className="view-details-btn"
                        onClick={() => handleViewPostDetails(activity.id)}
                      >
                        View Post
                      </button>
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
        
        <div className="dashboard-card quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/vehicles/add" className="action-button">
              <span className="action-icon">+</span>
              <span className="action-label">Add Vehicle</span>
            </Link>
            
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
              <div className="metric-value">24</div>
              <div className="metric-label">Vehicles in Stock</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value">8</div>
              <div className="metric-label">Social Posts This Week</div>
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
      </div>
      
      {showPostDetail && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-container">
            <SocialPostDetail 
              postId={selectedPost} 
              onClose={handleClosePostDetail} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
