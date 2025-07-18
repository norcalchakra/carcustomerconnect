import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getScheduledPosts, 
  cancelScheduledPost, 
  deleteScheduledPost,
  ScheduledPostWithDetails 
} from '../lib/scheduledPostsService';
import './ScheduledPostsPage.css';

interface ScheduledPostsPageProps {
  setPage: (page: string) => void;
}

const ScheduledPostsPage: React.FC<ScheduledPostsPageProps> = ({ setPage }) => {
  const [posts, setPosts] = useState<ScheduledPostWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const navigate = useNavigate();

  // Load scheduled posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getScheduledPosts();
      setPosts(fetchedPosts);
      setError(null);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load scheduled posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancelling a post
  const handleCancelPost = async (postId: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled post?')) {
      try {
        const success = await cancelScheduledPost(postId);
        if (success) {
          // Update the local state to reflect the cancelled post
          setPosts(posts.map(post => 
            post.id === postId ? { ...post, status: 'cancelled' } : post
          ));
        } else {
          setError('Failed to cancel post. Please try again.');
        }
      } catch (err) {
        console.error('Error cancelling post:', err);
        setError('Failed to cancel post. Please try again.');
      }
    }
  };

  // Handle deleting a post
  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled post? This action cannot be undone.')) {
      try {
        const success = await deleteScheduledPost(postId);
        if (success) {
          // Remove the deleted post from the local state
          setPosts(posts.filter(post => post.id !== postId));
        } else {
          setError('Failed to delete post. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting post:', err);
        setError('Failed to delete post. Please try again.');
      }
    }
  };

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    const now = new Date();
    const postTime = new Date(post.scheduled_time);
    
    if (activeTab === 'upcoming') {
      return postTime > now && post.status === 'pending';
    } else {
      return postTime <= now || post.status !== 'pending';
    }
  });

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return 'f';
      case 'instagram':
        return 'i';
      case 'google':
        return 'g';
      default:
        return '•';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-badge pending';
      case 'posted':
        return 'status-badge posted';
      case 'failed':
        return 'status-badge failed';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="scheduled-posts-page">
      <div className="page-header">
        <h1>Scheduled Posts</h1>
        <button 
          className="create-post-button"
          onClick={() => setPage('createPost')}
        >
          Create New Post
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past & Cancelled
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading scheduled posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty-state">
          <p>No {activeTab} posts found.</p>
          {activeTab === 'upcoming' && (
            <button 
              className="create-post-button"
              onClick={() => setPage('createPost')}
            >
              Schedule Your First Post
            </button>
          )}
        </div>
      ) : (
        <div className="posts-list">
          {filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-platforms">
                  {post.platforms.map(platform => (
                    <span 
                      key={platform} 
                      className={`platform-badge ${platform.toLowerCase()}`}
                      title={platform}
                    >
                      {getPlatformIcon(platform)}
                    </span>
                  ))}
                </div>
                <span className={getStatusBadgeClass(post.status || 'pending')}>
                  {post.status || 'pending'}
                </span>
              </div>

              <div className="post-time">
                <strong>Scheduled for:</strong> {formatDate(post.scheduled_time)}
              </div>

              {post.vehicle_id && (
                <div className="post-vehicle">
                  <strong>Vehicle:</strong> {post.year} {post.make} {post.model}
                  {post.stock_number && <span> (Stock #: {post.stock_number})</span>}
                </div>
              )}

              <div className="post-content">
                <p>{post.content.length > 150 
                  ? `${post.content.substring(0, 150)}...` 
                  : post.content}
                </p>
              </div>

              {post.image_urls && post.image_urls.length > 0 && (
                <div className="post-images">
                  {post.image_urls.slice(0, 3).map((url, index) => (
                    <div key={index} className="post-image-thumbnail">
                      <img src={url} alt={`Post image ${index + 1}`} />
                    </div>
                  ))}
                  {post.image_urls.length > 3 && (
                    <div className="post-image-more">
                      +{post.image_urls.length - 3}
                    </div>
                  )}
                </div>
              )}

              <div className="post-actions">
                {post.status === 'pending' && (
                  <>
                    <button 
                      className="edit-button"
                      onClick={() => {
                        // Navigate to edit page with post ID
                        // This would be implemented in a real app
                        alert('Edit functionality would be implemented here');
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={() => handleCancelPost(post.id!)}
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button 
                  className="delete-button"
                  onClick={() => handleDeletePost(post.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledPostsPage;
