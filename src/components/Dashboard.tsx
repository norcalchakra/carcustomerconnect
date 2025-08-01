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
import OnboardingPrompt from './ui/OnboardingPrompt';

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

        if (error) {
          // If error is "PGRST116" (no rows returned), user has no dealership
          if (error.code === 'PGRST116') {
            console.log('No dealership found for user - will show onboarding prompt');
            setDealershipId(null);
          } else {
            throw error;
          }
        } else if (data) {
          setDealershipId(data.id);
        }
      } catch (err) {
        console.error('Error fetching dealership:', err);
        setError('Failed to load dealership information');
      } finally {
        setLoading(false);
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

  // Debug logging for onboarding prompt logic
  console.log('Dashboard render - loading:', loading, 'dealershipId:', dealershipId, 'user:', !!user);
  
  // Show onboarding prompt if user doesn't have a dealership
  if (!loading && !dealershipId && user) {
    console.log('Showing onboarding prompt for user without dealership');
    return (
      <>
        <div className="min-h-screen bg-gray-50 searchlight-sweep onboarding-disabled">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Disabled UI content will be rendered but overlayed */}
            <div className="comic-panel comic-panel-primary mb-8">
              <div className="comic-panel-header">
                <h1 className="comic-panel-title">Command Center</h1>
              </div>
              <div className="comic-panel-content">
                <div className="speech-bubble speech-bubble-left mb-4">
                  <p className="text-gray-800 font-medium mb-0">Welcome back, Agent! Here's your mission status and vehicle intelligence.</p>
                </div>
              </div>
            </div>
            {/* Quick Actions - Disabled */}
            <div className="comic-grid comic-grid-3 mb-8">
              <div className="comic-panel comic-panel-secondary">
                <div className="comic-panel-header">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="comic-panel-title text-lg">Add Vehicle</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="comic-panel comic-panel-secondary">
                <div className="comic-panel-header">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="comic-panel-title text-lg">Create Post</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="comic-panel comic-panel-secondary">
                <div className="comic-panel-header">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="comic-panel-title text-lg">Vehicle Workflow</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <OnboardingPrompt userName={user?.user_metadata?.email?.split('@')[0]} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 searchlight-sweep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="comic-panel comic-panel-primary mb-8">
          <div className="comic-panel-header">
            <h1 className="comic-panel-title">Command Center</h1>
          </div>
          <div className="comic-panel-content">
            <div className="speech-bubble speech-bubble-left mb-4">
              <p className="text-gray-800 font-medium mb-0">Welcome back, Agent! Here's your mission status and vehicle intelligence.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="comic-grid comic-grid-3 mb-8">
          <div className="comic-panel comic-panel-secondary comic-panel-hover">
            <div className="comic-panel-header">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🚗</span>
                </div>
                <div className="ml-4">
                  <h3 className="comic-panel-title text-lg">Add Vehicle</h3>
                </div>
              </div>
            </div>
            <div className="comic-panel-content">
              <div className="thought-cloud mb-4">
                <p className="text-gray-700 mb-0">Time to add another vehicle to our fleet...</p>
              </div>
              <button
                onClick={() => setIsAddVehicleModalOpen(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                Add Vehicle
              </button>
            </div>
          </div>

          <div className="comic-panel comic-panel-accent comic-panel-hover">
            <div className="comic-panel-header">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="ml-4">
                  <h3 className="comic-panel-title text-lg">Create Post</h3>
                </div>
              </div>
            </div>
            <div className="comic-panel-content">
              <div className="thought-cloud mb-4">
                <p className="text-gray-700 mb-0">What story should we tell today?</p>
              </div>
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-bold"
              >
                Create Post
              </button>
            </div>
          </div>

          <div className="comic-panel comic-panel-action comic-panel-hover">
            <div className="comic-panel-header">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div className="ml-4">
                  <h3 className="comic-panel-title text-lg">Vehicle Workflow</h3>
                </div>
              </div>
            </div>
            <div className="comic-panel-content">
              <div className="thought-cloud mb-4">
                <p className="text-gray-700 mb-0">Let's track our sales progress...</p>
              </div>
              <Link
                to="/workflow"
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-bold text-center"
              >
                Open Workflow
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="comic-panel comic-panel-thick" style={{padding: '1rem', margin: '0'}}>
              <div className="comic-panel-header" style={{marginBottom: '1rem'}}>
                <h2 className="comic-panel-title">Recent Activity</h2>
              </div>
              <div className="comic-panel-content" style={{padding: '0'}}>
                {loading ? (
                  <div className="text-center py-3">
                    <div className="comic-panel-loading">Loading recent activity...</div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-center py-3">{error}</div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-gray-600">No recent activity found.</p>
                    <p className="text-gray-500 text-sm">Start by adding vehicles or creating social media posts.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      {recentActivity
                        .slice(0, 5) // Show 5 most recent items
                        .map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                            <div className="flex-shrink-0">
                              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs">📊</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-semibold">{activity.vehicle}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                              <p className="text-sm text-gray-700">{activity.notes}</p>
                            </div>
                            <div className="flex-shrink-0 flex space-x-1">
                              {activity.vehicleId && (
                                <Link
                                  to={`/workflow?vehicle=${encodeURIComponent(activity.vehicle)}`}
                                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                >
                                  View Vehicle
                                </Link>
                              )}
                              {activity.isSocialPost && (
                                <button
                                  onClick={() => handleViewPostDetails(activity.id.toString())}
                                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                                >
                                  View Post
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* View All Activity Link */}
                    <div className="border-t border-gray-200 pt-2">
                      <Link
                        to="/activity"
                        className="block w-full text-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        View All Activity ({recentActivity.length} total)
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="lg:col-span-1">
            <div className="comic-panel comic-panel-secondary" style={{padding: '1rem', margin: '0'}}>
              <div className="comic-panel-header" style={{marginBottom: '1rem'}}>
                <h2 className="comic-panel-title">Mission Analytics</h2>
              </div>
              <div className="comic-panel-content" style={{padding: '0'}}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded border-2 border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{recentActivity.length}</div>
                    <div className="text-xs text-gray-600 font-semibold">Total Activities</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded border-2 border-green-200">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-xs text-gray-600 font-semibold">Posts Today</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded border-2 border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-xs text-gray-600 font-semibold">Vehicles Added</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded border-2 border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-xs text-gray-600 font-semibold">Pending Tasks</div>
                  </div>
                </div>
                
                {/* Coming Soon Section */}
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-dashed border-yellow-300">
                  <div className="text-center">
                    <div className="exclamation-bubble mb-2">
                      <span className="text-xs font-bold">Coming Soon!</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Advanced Analytics</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      📈 Performance metrics<br/>
                      📊 Engagement stats<br/>
                      🎯 Sales tracking<br/>
                      📱 Multi-platform data
                    </p>
                    <div className="speech-bubble speech-bubble-center">
                      <p className="text-xs text-gray-700 mb-0">Stay tuned for insights!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
