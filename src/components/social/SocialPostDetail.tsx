import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socialPostsApi, SocialPost } from '../../lib/socialPostsApi.improved';
import './SocialPostDetail.css';

interface SocialPostDetailProps {
  postId?: number;
  onClose?: () => void;
}

export const SocialPostDetail: React.FC<SocialPostDetailProps> = ({ 
  postId: propPostId,
  onClose 
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use postId from props or from URL params
  const postId = propPostId || (params.id ? parseInt(params.id) : undefined);
  
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const postData = await socialPostsApi.getById(postId);
        
        if (!postData) {
          setError('Post not found');
        } else {
          setPost(postData);
          
          // If the post has engagement metrics, update them
          if (postData.post_id && postData.platform) {
            try {
              const engagement = await socialPostsApi.getEngagement(postData.platform, postData.post_id);
              
              // Update the post with engagement data
              if (engagement) {
                await socialPostsApi.update(postId, { 
                  engagement: engagement 
                });
                
                // Update local state with engagement data
                setPost({
                  ...postData,
                  engagement: engagement
                });
              }
            } catch (engagementError) {
              console.error('Error fetching engagement metrics:', engagementError);
              // Don't set error state, as this is not critical
            }
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [postId]);
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };
  
  const handleViewOnPlatform = () => {
    if (post?.post_url) {
      window.open(post.post_url, '_blank');
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return 'f';
      case 'instagram':
        return 'i';
      case 'google':
        return 'g';
      default:
        return '';
    }
  };
  
  const getPlatformClass = (platform: string) => {
    return platform.toLowerCase();
  };
  
  if (loading) {
    return (
      <div className="social-post-detail loading">
        <div className="loading-spinner"></div>
        <p>Loading post details...</p>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="social-post-detail error">
        <h2>Error</h2>
        <p>{error || 'Failed to load post'}</p>
        <button className="btn btn-primary" onClick={handleClose}>
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="social-post-detail">
      <div className="post-header">
        <h2>Social Media Post</h2>
        <button className="close-btn" onClick={handleClose}>×</button>
      </div>
      
      <div className="post-info">
        <div className="platform-badge">
          <span className={`platform-icon ${getPlatformClass(post.platform)}`}>
            {getPlatformIcon(post.platform)}
          </span>
          <span className="platform-name">{post.platform}</span>
        </div>
        
        <div className="post-meta">
          <div className="meta-item">
            <span className="meta-label">Posted:</span>
            <span className="meta-value">{formatDate(post.created_at)}</span>
          </div>
          
          {post.scheduled_for && (
            <div className="meta-item">
              <span className="meta-label">Scheduled For:</span>
              <span className="meta-value">{formatDate(post.scheduled_for)}</span>
            </div>
          )}
          
          <div className="meta-item">
            <span className="meta-label">Status:</span>
            <span className={`status-badge ${post.status}`}>{post.status}</span>
          </div>
        </div>
      </div>
      
      <div className="post-content">
        <h3>Content</h3>
        <div className="content-text">
          {post.content}
        </div>
      </div>
      
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="post-images">
          <h3>Images</h3>
          <div className="image-gallery">
            {post.image_urls.map((url, index) => (
              <div key={index} className="gallery-image">
                <img src={url} alt={`Post image ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="post-engagement">
        <h3>Engagement</h3>
        <div className="engagement-metrics">
          <div className="metric">
            <span className="metric-value">{post.engagement?.likes || 0}</span>
            <span className="metric-label">Likes</span>
          </div>
          <div className="metric">
            <span className="metric-value">{post.engagement?.comments || 0}</span>
            <span className="metric-label">Comments</span>
          </div>
          <div className="metric">
            <span className="metric-value">{post.engagement?.shares || 0}</span>
            <span className="metric-label">Shares</span>
          </div>
        </div>
      </div>
      
      <div className="post-actions">
        {post.post_url && (
          <button 
            className="btn btn-primary"
            onClick={handleViewOnPlatform}
          >
            View on {post.platform}
          </button>
        )}
      </div>
    </div>
  );
};
