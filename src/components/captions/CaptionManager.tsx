import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleEvent, Caption, captionApi } from '../../lib/api';
import { SocialPostForm } from './SocialPostForm';

interface CaptionManagerProps {
  vehicle: Vehicle;
  event: VehicleEvent;
}

export const CaptionManager: React.FC<CaptionManagerProps> = ({ vehicle, event }) => {
  const [selectedCaption, setSelectedCaption] = useState<Caption | null>(null);
  
  // Check if there's an existing caption for this event
  useEffect(() => {
    const checkExistingCaption = async () => {
      try {
        const caption = await captionApi.getByEventId(event.id);
        if (caption) {
          setSelectedCaption(caption);
        } else {
          // Create a dummy caption if none exists
          const dummyCaption: Caption = {
            vehicle_id: vehicle.id,
            event_id: event.id,
            content: '',
            hashtags: []
          };
          setSelectedCaption(dummyCaption);
        }
      } catch (err) {
        console.error('Error checking for existing caption:', err);
        // Create a dummy caption if there's an error
        const dummyCaption: Caption = {
          vehicle_id: vehicle.id,
          event_id: event.id,
          content: '',
          hashtags: []
        };
        setSelectedCaption(dummyCaption);
      }
    };
    
    checkExistingCaption();
  }, [event.id, vehicle.id]);

  return (
    <div>
      {selectedCaption && (
        <SocialPostForm 
          caption={selectedCaption}
          vehicle={vehicle}
          event={event}
          onPost={() => {}}
        />
      )}
    </div>
  );
};
