import React, { useState, useEffect } from 'react';
import { captionApi, Caption, Vehicle } from '../../lib/api';
import { Spinner } from '../ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

interface CaptionListProps {
  vehicle: Vehicle;
  onEditCaption?: (caption: Caption) => void;
}

export const CaptionList: React.FC<CaptionListProps> = ({ vehicle, onEditCaption }) => {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        setIsLoading(true);
        const data = await captionApi.getForVehicle(vehicle.id);
        setCaptions(data);
      } catch (err) {
        console.error('Error fetching captions:', err);
        setError('Failed to load captions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaptions();
  }, [vehicle.id]);

  const handleDeleteCaption = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this caption?')) {
      try {
        await captionApi.delete(id);
        setCaptions(captions.filter(caption => caption.id !== id));
      } catch (err) {
        console.error('Error deleting caption:', err);
        setError('Failed to delete caption. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Spinner /></div>;
  }

  if (captions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
        No captions have been generated for this vehicle yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold p-4 border-b">Saved Captions</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 m-4 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="divide-y">
        {captions.map((caption) => (
          <div key={caption.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500">
                {caption.created_at && formatDistanceToNow(new Date(caption.created_at), { addSuffix: true })}
              </span>
              <div className="flex space-x-2">
                {onEditCaption && (
                  <button 
                    onClick={() => onEditCaption(caption)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button 
                  onClick={() => caption.id && handleDeleteCaption(caption.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-gray-800 mb-3 whitespace-pre-line">{caption.content}</p>
            
            <div className="flex flex-wrap gap-1">
              {caption.hashtags?.map((tag, index) => (
                <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="mt-3 flex space-x-2">
              {caption.posted_to_facebook && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  Posted to Facebook
                </span>
              )}
              {caption.posted_to_instagram && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                  Posted to Instagram
                </span>
              )}
              {caption.posted_to_google && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Posted to Google
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
