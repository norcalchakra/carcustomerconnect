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
            id: 'temp-' + Date.now(),
            content: '',
            eventId: String(event.id),
            vehicleId: String(vehicle.id),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setSelectedCaption(dummyCaption);
        }
      } catch (err) {
        console.error('Error checking for existing caption:', err);
        // Create a dummy caption if there's an error
        const dummyCaption: Caption = {
          id: 'temp-' + Date.now(),
          content: '',
          eventId: String(event.id),
          vehicleId: String(vehicle.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
          onPost={() => {}}
        />
      )}
    </div>
  );
};
