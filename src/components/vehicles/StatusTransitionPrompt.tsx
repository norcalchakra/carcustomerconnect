import React, { useState } from 'react';
import { Vehicle } from '../../lib/api';
import './StatusTransitionPrompt.css';

interface StatusTransitionPromptProps {
  vehicle: Vehicle;
  onStatusChange: (newStatus: Vehicle['status'], notes?: string) => void;
  onDismiss: () => void;
  isVisible: boolean;
}

const StatusTransitionPrompt: React.FC<StatusTransitionPromptProps> = ({
  vehicle,
  onStatusChange,
  onDismiss,
  isVisible
}) => {
  const [selectedStatus, setSelectedStatus] = useState<Vehicle['status'] | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { key: 'acquired', label: 'Acquired', icon: '📥', description: 'Vehicle just arrived' },
    { key: 'in_service', label: 'In Service', icon: '🔧', description: 'Being reconditioned' },
    { key: 'ready_for_sale', label: 'Ready for Sale', icon: '✨', description: 'Ready for customers' },
    { key: 'sold', label: 'Sold', icon: '🎉', description: 'Delivered to customer' }
  ] as const;

  const currentStatusIndex = statusOptions.findIndex(option => option.key === vehicle.status);
  const nextStatus = statusOptions[currentStatusIndex + 1];

  // Get contextual suggestions based on current status
  const getStatusSuggestions = () => {
    switch (vehicle.status) {
      case 'acquired':
        return {
          primary: 'in_service',
          message: 'Great post! Is this vehicle now going into service for reconditioning?',
          reasons: [
            'Vehicle inspection completed',
            'Service work has begun',
            'Reconditioning process started'
          ]
        };
      case 'in_service':
        return {
          primary: 'ready_for_sale',
          message: 'Awesome update! Is the vehicle now ready for sale?',
          reasons: [
            'All service work completed',
            'Final quality check passed',
            'Vehicle is customer-ready'
          ]
        };
      case 'ready_for_sale':
        return {
          primary: 'sold',
          message: 'Nice sales post! Has this vehicle been sold?',
          reasons: [
            'Customer purchased the vehicle',
            'Delivery completed',
            'Sale finalized'
          ]
        };
      default:
        return null;
    }
  };

  const suggestions = getStatusSuggestions();

  const handleQuickAdvance = async () => {
    if (!suggestions) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(suggestions.primary, `Advanced from ${vehicle.status} after social media post`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomStatusChange = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(selectedStatus, notes || `Status changed to ${selectedStatus} after social media post`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'acquired': return '#3b82f6';
      case 'in_service': return '#f59e0b';
      case 'ready_for_sale': return '#10b981';
      case 'sold': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="status-transition-overlay">
      <div className="status-transition-prompt">
        <div className="prompt-header">
          <div className="success-icon">🎉</div>
          <h3>Post Successful!</h3>
          <button className="close-button" onClick={onDismiss}>×</button>
        </div>

        <div className="vehicle-info">
          <span className="vehicle-name">{vehicle.year} {vehicle.make} {vehicle.model}</span>
          <div className="current-status">
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(vehicle.status) }}
            >
              {statusOptions.find(s => s.key === vehicle.status)?.icon} {statusOptions.find(s => s.key === vehicle.status)?.label}
            </span>
          </div>
        </div>

        {suggestions && (
          <div className="quick-advance-section">
            <p className="suggestion-message">{suggestions.message}</p>
            
            <div className="quick-advance-card">
              <div className="next-status-info">
                <span 
                  className="next-status-badge"
                  style={{ backgroundColor: getStatusColor(suggestions.primary) }}
                >
                  {statusOptions.find(s => s.key === suggestions.primary)?.icon} {statusOptions.find(s => s.key === suggestions.primary)?.label}
                </span>
                <span className="next-status-description">
                  {statusOptions.find(s => s.key === suggestions.primary)?.description}
                </span>
              </div>
              
              <div className="reasons-list">
                <span className="reasons-label">Common reasons:</span>
                <ul>
                  {suggestions.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>

              <button 
                className="quick-advance-button"
                onClick={handleQuickAdvance}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : `Yes, move to ${statusOptions.find(s => s.key === suggestions.primary)?.label}`}
              </button>
            </div>
          </div>
        )}

        <div className="divider">
          <span>or</span>
        </div>

        <div className="custom-status-section">
          <h4>Choose a different status:</h4>
          
          <div className="status-options">
            {statusOptions.map((option) => (
              <button
                key={option.key}
                className={`status-option ${selectedStatus === option.key ? 'selected' : ''} ${option.key === vehicle.status ? 'current' : ''}`}
                onClick={() => setSelectedStatus(option.key)}
                disabled={option.key === vehicle.status}
              >
                <span className="option-icon">{option.icon}</span>
                <div className="option-content">
                  <span className="option-label">{option.label}</span>
                  <span className="option-description">{option.description}</span>
                </div>
                {option.key === vehicle.status && <span className="current-indicator">Current</span>}
              </button>
            ))}
          </div>

          {selectedStatus && selectedStatus !== vehicle.status && (
            <div className="notes-section">
              <label htmlFor="status-notes">Notes (optional):</label>
              <textarea
                id="status-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
              />
              
              <button 
                className="update-status-button"
                onClick={handleCustomStatusChange}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : `Update to ${statusOptions.find(s => s.key === selectedStatus)?.label}`}
              </button>
            </div>
          )}
        </div>

        <div className="prompt-footer">
          <button className="skip-button" onClick={onDismiss}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusTransitionPrompt;
