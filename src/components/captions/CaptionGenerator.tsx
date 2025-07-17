import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleEvent, captionApi, dealershipApi } from '../../lib/api';
import { generateCaption, CaptionRequest, CaptionResponse } from '../../lib/openai';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/Spinner';

interface CaptionGeneratorProps {
  vehicle: Vehicle;
  event: VehicleEvent;
  onCaptionSaved?: () => void;
}

export const CaptionGenerator: React.FC<CaptionGeneratorProps> = ({ 
  vehicle, 
  event, 
  onCaptionSaved 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [dealershipName, setDealershipName] = useState<string>('');
  const [existingCaption, setExistingCaption] = useState<any>(null);
  const { user } = useAuth();

  // Fetch dealership name and check for existing caption
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Get dealership info
        if (user) {
          const dealership = await dealershipApi.getByUserId(user.id);
          if (dealership) {
            setDealershipName(dealership.name);
          }
        }
        
        // Check if a caption already exists for this event
        const existingCaption = await captionApi.getByEventId(event.id);
        if (existingCaption) {
          setExistingCaption(existingCaption);
          setCaption(existingCaption.content);
          setHashtags(existingCaption.hashtags || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [event.id, user]);

  const handleGenerateCaption = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const request: CaptionRequest = {
        vehicle,
        event,
        dealershipName,
        additionalNotes: additionalNotes || undefined
      };
      
      const response = await generateCaption(request);
      
      setCaption(response.caption);
      setHashtags(response.hashtags);
    } catch (err) {
      console.error('Error generating caption:', err);
      setError('Failed to generate caption. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCaption = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const captionData = {
        vehicle_id: vehicle.id,
        event_id: event.id,
        content: caption,
        hashtags
      };
      
      if (existingCaption) {
        await captionApi.update(existingCaption.id, captionData);
      } else {
        await captionApi.create(captionData);
      }
      
      if (onCaptionSaved) {
        onCaptionSaved();
      }
    } catch (err) {
      console.error('Error saving caption:', err);
      setError('Failed to save caption. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Spinner /></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">Social Media Caption</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            id="additionalNotes"
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Add any specific details you want to highlight in the caption..."
          />
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleGenerateCaption}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{existingCaption ? 'Regenerate Caption' : 'Generate AI Caption'}</span>
              </>
            )}
          </button>
        </div>
        
        {caption && (
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                Caption
              </label>
              <textarea
                id="caption"
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-1">
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                    #{tag}
                    <button
                      onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  className="border border-gray-300 rounded-full px-3 py-1 text-sm flex-grow"
                  placeholder="Add hashtag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      setHashtags([...hashtags, e.currentTarget.value.trim()]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSaveCaption}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                {existingCaption ? 'Update Caption' : 'Save Caption'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
