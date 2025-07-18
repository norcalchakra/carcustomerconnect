import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import './PostScheduler.css';

interface PostSchedulerProps {
  postContent: string;
  imageUrls?: string[];
  platforms: string[];
  onSchedule: (scheduledTime: Date, platforms: string[]) => void;
  onCancel: () => void;
}

const PostScheduler: React.FC<PostSchedulerProps> = ({
  postContent,
  imageUrls,
  platforms: initialPlatforms,
  onSchedule,
  onCancel
}) => {
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialPlatforms);
  const [recommendedTimes, setRecommendedTimes] = useState<{time: string, engagement: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get tomorrow's date in YYYY-MM-DD format for the min date attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
  
  // Get current time in HH:MM format
  const now = new Date();
  const currentTimeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Handle platform selection
  const handlePlatformToggle = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };
  
  // Get recommended posting times
  const getRecommendedTimes = () => {
    // In a real implementation, this would call an API or analyze historical data
    // For now, we'll return mock recommended times
    
    const mockRecommendedTimes = [
      { time: '08:00', engagement: 'High morning engagement' },
      { time: '12:30', engagement: 'Lunch break browsing peak' },
      { time: '17:30', engagement: 'After work commute time' },
      { time: '20:00', engagement: 'Evening relaxation period' }
    ];
    
    setRecommendedTimes(mockRecommendedTimes);
  };
  
  // Set a recommended time
  const setRecommendedTime = (time: string) => {
    setScheduledTime(time);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate || !scheduledTime || selectedPlatforms.length === 0) {
      alert('Please select a date, time, and at least one platform');
      return;
    }
    
    setLoading(true);
    
    // Create a Date object from the selected date and time
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Check if the scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      alert('Please select a future date and time');
      setLoading(false);
      return;
    }
    
    // In a real implementation, this would save to the database
    // For now, we'll just call the onSchedule callback
    setTimeout(() => {
      onSchedule(scheduledDateTime, selectedPlatforms);
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div className="post-scheduler">
      <div className="scheduler-header">
        <h2>Schedule Your Post</h2>
        <button onClick={onCancel} className="close-button">×</button>
      </div>
      
      <div className="post-preview">
        <h3>Post Preview</h3>
        <div className="preview-content">
          <p>{postContent}</p>
          {imageUrls && imageUrls.length > 0 && (
            <div className="preview-images">
              {imageUrls.map((url, index) => (
                <div key={index} className="preview-image">
                  <img src={url} alt={`Preview ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Platforms:</label>
          <div className="platform-options">
            <div 
              className={`platform-option ${selectedPlatforms.includes('facebook') ? 'selected' : ''}`}
              onClick={() => handlePlatformToggle('facebook')}
            >
              <span className="platform-icon facebook">f</span>
              <span>Facebook</span>
            </div>
            
            <div 
              className={`platform-option ${selectedPlatforms.includes('instagram') ? 'selected' : ''}`}
              onClick={() => handlePlatformToggle('instagram')}
            >
              <span className="platform-icon instagram">i</span>
              <span>Instagram</span>
            </div>
            
            <div 
              className={`platform-option ${selectedPlatforms.includes('google') ? 'selected' : ''}`}
              onClick={() => handlePlatformToggle('google')}
            >
              <span className="platform-icon google">g</span>
              <span>Google Business</span>
            </div>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="scheduled-date">Date:</label>
            <input
              type="date"
              id="scheduled-date"
              min={tomorrowFormatted}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="scheduled-time">Time:</label>
            <input
              type="time"
              id="scheduled-time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="recommended-times">
          <div className="recommended-header">
            <h3>Recommended Times</h3>
            <button 
              type="button" 
              className="recommend-button"
              onClick={getRecommendedTimes}
            >
              Get Recommendations
            </button>
          </div>
          
          {recommendedTimes.length > 0 && (
            <div className="time-recommendations">
              {recommendedTimes.map((rec, index) => (
                <div 
                  key={index} 
                  className="time-recommendation"
                  onClick={() => setRecommendedTime(rec.time)}
                >
                  <span className="rec-time">{rec.time}</span>
                  <span className="rec-engagement">{rec.engagement}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="scheduler-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="schedule-button"
            disabled={loading || !scheduledDate || !scheduledTime || selectedPlatforms.length === 0}
          >
            {loading ? 'Scheduling...' : 'Schedule Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostScheduler;
