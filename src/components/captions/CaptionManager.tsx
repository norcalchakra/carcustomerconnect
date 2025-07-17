import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleEvent, Caption, captionApi } from '../../lib/api';
import { CaptionGenerator } from './CaptionGenerator';
import { CaptionList } from './CaptionList';
import { SocialPostForm } from './SocialPostForm';

interface CaptionManagerProps {
  vehicle: Vehicle;
  event: VehicleEvent;
}

export const CaptionManager: React.FC<CaptionManagerProps> = ({ vehicle, event }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [selectedCaption, setSelectedCaption] = useState<Caption | null>(null);
  
  // Check if there's an existing caption for this event
  useEffect(() => {
    const checkExistingCaption = async () => {
      try {
        const caption = await captionApi.getByEventId(event.id);
        if (caption) {
          setSelectedCaption(caption);
        }
      } catch (err) {
        console.error('Error checking for existing caption:', err);
      }
    };
    
    checkExistingCaption();
  }, [event.id]);
  
  const handleCaptionSaved = async () => {
    // After saving, refresh the caption data
    try {
      const caption = await captionApi.getByEventId(event.id);
      if (caption) {
        setSelectedCaption(caption);
      }
      setActiveTab('history');
    } catch (err) {
      console.error('Error refreshing caption data:', err);
    }
  };
  
  const handleEditCaption = (caption: Caption) => {
    setSelectedCaption(caption);
    setActiveTab('generate');
  };

  return (
    <div className="space-y-4">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'generate' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Caption
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'history' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Caption History
        </button>
      </div>
      
      <div>
        {activeTab === 'generate' && (
          <CaptionGenerator 
            vehicle={vehicle} 
            event={event}
            onCaptionSaved={handleCaptionSaved}
          />
        )}
        
        {activeTab === 'history' && (
          <CaptionList 
            vehicle={vehicle}
            onEditCaption={handleEditCaption}
          />
        )}
      </div>
      
      {selectedCaption && (
        <div className="mt-6">
          <SocialPostForm 
            caption={selectedCaption}
            onPost={() => {
              // Refresh caption data after posting
              setActiveTab('history');
            }}
          />
        </div>
      )}
    </div>
  );
};
