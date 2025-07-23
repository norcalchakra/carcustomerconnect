import React, { useState } from 'react';
import { Vehicle } from '../../lib/api';
import './VehicleProgressTracker.css';

interface VehicleProgressTrackerProps {
  vehicle: Vehicle;
  onStatusChange?: (newStatus: Vehicle['status']) => void;
  onSuggestedAction?: (action: string) => void;
}

const VehicleProgressTracker: React.FC<VehicleProgressTrackerProps> = ({
  vehicle,
  onStatusChange,
  onSuggestedAction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const stages = [
    { key: 'acquired', label: 'Acquired', icon: '📥' },
    { key: 'in_service', label: 'In Service', icon: '🔧' },
    { key: 'ready_for_sale', label: 'Ready for Sale', icon: '✨' },
    { key: 'sold', label: 'Sold', icon: '🎉' }
  ] as const;

  const currentStageIndex = stages.findIndex(stage => stage.key === vehicle.status);
  const nextStage = stages[currentStageIndex + 1];
  const currentStage = stages[currentStageIndex];

  // Get suggested actions based on current status
  const getSuggestedActions = (status: Vehicle['status']) => {
    switch (status) {
      case 'acquired':
        return [
          { action: 'Take arrival photos', description: 'Document the vehicle\'s condition' },
          { action: 'Create acquisition post', description: 'Share the new arrival on social media' },
          { action: 'Schedule inspection', description: 'Plan reconditioning work' }
        ];
      case 'in_service':
        return [
          { action: 'Document service work', description: 'Photo progress of reconditioning' },
          { action: 'Share service updates', description: 'Show the work being done' },
          { action: 'Complete final inspection', description: 'Ensure quality standards' }
        ];
      case 'ready_for_sale':
        return [
          { action: 'Take final photos', description: 'Showcase the finished vehicle' },
          { action: 'Create sales post', description: 'Announce availability to customers' },
          { action: 'Update inventory', description: 'List on sales platforms' }
        ];
      case 'sold':
        return [
          { action: 'Customer delivery post', description: 'Celebrate the happy customer' },
          { action: 'Request review', description: 'Ask for customer feedback' }
        ];
      default:
        return [];
    }
  };

  const suggestedActions = getSuggestedActions(vehicle.status);

  const handleAdvanceStatus = () => {
    if (nextStage && onStatusChange) {
      onStatusChange(nextStage.key);
    }
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'acquired': return '#3b82f6'; // blue
      case 'in_service': return '#f59e0b'; // amber
      case 'ready_for_sale': return '#10b981'; // emerald
      case 'sold': return '#8b5cf6'; // violet
      default: return '#6b7280'; // gray
    }
  };

  const getDaysInStatus = () => {
    return Math.floor((Date.now() - new Date(vehicle.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgressPercentage = () => {
    return Math.round(((currentStageIndex + 1) / stages.length) * 100);
  };

  if (!isExpanded) {
    // Compact view - minimalist card
    return (
      <div className="vehicle-progress-tracker compact" onClick={() => setIsExpanded(true)}>
        <div className="compact-header">
          <div className="vehicle-identity">
            <span className="vehicle-name">{vehicle.year} {vehicle.make} {vehicle.model}</span>
            <span className="stock-number">#{vehicle.stock_number}</span>
          </div>
          <button className="expand-button" title="Click to expand details">
            <span className="expand-icon">▼</span>
          </button>
        </div>
        
        <div className="compact-status">
          <div className="status-indicator">
            <div 
              className="status-dot"
              style={{ backgroundColor: getStatusColor(vehicle.status) }}
            >
              {currentStage?.icon}
            </div>
            <span className="status-text">{currentStage?.label}</span>
          </div>
          
          <div className="compact-progress">
            <div className="progress-mini-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getStatusColor(vehicle.status)
                }}
              />
            </div>
            <span className="progress-text">{getProgressPercentage()}%</span>
          </div>
        </div>
        
        <div className="compact-meta">
          <span className="days-indicator">{getDaysInStatus()}d in stage</span>
          {nextStage && (
            <span className="next-stage">Next: {nextStage.label}</span>
          )}
        </div>
      </div>
    );
  }

  // Expanded view - full details (original design)
  return (
    <div className="vehicle-progress-tracker expanded">
      <div className="progress-header">
        <div className="header-top">
          <h3>Vehicle Journey Progress</h3>
          <button 
            className="collapse-button" 
            onClick={() => setIsExpanded(false)}
            title="Collapse to compact view"
          >
            <span className="collapse-icon">▲</span>
          </button>
        </div>
        <div className="vehicle-info">
          <span className="vehicle-name">{vehicle.year} {vehicle.make} {vehicle.model}</span>
          <span className="stock-number">Stock #{vehicle.stock_number}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-stages">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isUpcoming = index > currentStageIndex;

            return (
              <div
                key={stage.key}
                className={`progress-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`}
              >
                <div 
                  className="stage-icon"
                  style={{ backgroundColor: isCurrent ? getStatusColor(vehicle.status) : undefined }}
                >
                  {stage.icon}
                </div>
                <div className="stage-label">{stage.label}</div>
                {index < stages.length - 1 && (
                  <div className={`stage-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Info */}
      <div className="current-status-info">
        <div className="status-badge" style={{ backgroundColor: getStatusColor(vehicle.status) }}>
          {stages[currentStageIndex]?.icon} {stages[currentStageIndex]?.label}
        </div>
        {nextStage && (
          <div className="next-stage-info">
            <span>Next: {nextStage.label}</span>
            <button 
              className="advance-button"
              onClick={handleAdvanceStatus}
              title={`Move to ${nextStage.label}`}
            >
              Advance →
            </button>
          </div>
        )}
      </div>

      {/* Suggested Actions */}
      <div className="suggested-actions">
        <h4>Suggested Next Steps</h4>
        <div className="actions-list">
          {suggestedActions.map((item, index) => (
            <div key={index} className="action-item">
              <button
                className="action-button"
                onClick={() => onSuggestedAction?.(item.action)}
              >
                <span className="action-title">{item.action}</span>
                <span className="action-description">{item.description}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Days in Current Stage</span>
          <span className="stat-value">{getDaysInStatus()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Progress</span>
          <span className="stat-value">{getProgressPercentage()}%</span>
        </div>
      </div>
    </div>
  );
};

export default VehicleProgressTracker;
