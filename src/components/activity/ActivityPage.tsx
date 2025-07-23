import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllActivity, RecentActivity } from '../../lib/activityService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import './ActivityPage.css';

const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [allActivity, setAllActivity] = useState<(RecentActivity & { imageUrl?: string })[]>([]);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10; // Show more items per page on the dedicated activity page

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

      console.log('Fetching all activity for dealership:', dealershipId);
      // Fetch a large number of items for the full activity view
      const activity = await fetchAllActivity(dealershipId, 100);
      console.log('Activity fetched:', activity);
      setAllActivity(activity);
      
      // Calculate total pages
      setTotalPages(Math.max(1, Math.ceil(activity.length / itemsPerPage)));
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  }, [dealershipId]);

  // Fetch activity on component mount
  useEffect(() => {
    if (dealershipId) {
      refreshActivity();
    }
  }, [dealershipId, refreshActivity]);

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

  return (
    <div className="activity-page">
      <div className="activity-header">
        <h1>All Activity</h1>
        <Link to="/" className="back-button">Back to Dashboard</Link>
      </div>

      <div className="activity-container">
        {loading ? (
          <div className="loading-indicator">Loading activity data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : allActivity.length === 0 ? (
          <div className="empty-state">
            <p>No activity found.</p>
            <p>Start by adding vehicles or creating social media posts.</p>
          </div>
        ) : (
          <>
            <ul className="activity-list">
              {/* Show items for the current page */}
              {allActivity
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((activity) => (
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
                          <div className="activity-notes">
                            {activity.notes}
                          </div>
                          <Link
                            to={`/social/posts/${typeof activity.id === 'string' ? activity.id.split('_')[1] : activity.id}`}
                            className="view-details-link"
                          >
                            View Full Post
                          </Link>
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
            {allActivity.length > itemsPerPage && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  Showing {Math.min(allActivity.length, (currentPage - 1) * itemsPerPage + 1)}-
                  {Math.min(allActivity.length, currentPage * itemsPerPage)} of {allActivity.length}
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
