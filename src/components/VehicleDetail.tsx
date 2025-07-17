import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleEvent, eventsApi } from '../lib/api';
import Modal from './ui/Modal';
import VehicleForm from './vehicles/VehicleForm';
import EventForm from './events/EventForm';
import EventTimeline from './events/EventTimeline';
import { CaptionManager } from './captions/CaptionManager';
import { useAuth } from '../context/AuthContext';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack }) => {
  const { /* user not used currently */ } = useAuth();
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle>(vehicle);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VehicleEvent | null>(null);

  // Format helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const formatMileage = (mileage: number | null) => {
    if (mileage === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  // Fetch vehicle events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentVehicle?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const eventData = await eventsApi.getForVehicle(currentVehicle.id);
        setEvents(eventData);
      } catch (err) {
        console.error('Error fetching vehicle events:', err);
        setError('Failed to load vehicle events. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentVehicle?.id]);

  // Event handlers
  const handleEditVehicle = () => {
    setIsEditModalOpen(true);
  };

  const handleAddEvent = () => {
    setIsAddEventModalOpen(true);
  };

  const handleVehicleSaved = (updatedVehicle: Vehicle) => {
    setCurrentVehicle(updatedVehicle);
    setIsEditModalOpen(false);
  };

  const handleEventSaved = (newEvent: VehicleEvent) => {
    setEvents(prev => [...prev, newEvent]);
    setIsAddEventModalOpen(false);
    
    // If this is a status change event, update the vehicle status
    if (newEvent.event_type === 'acquired') {
      setCurrentVehicle(prev => ({ ...prev, status: 'acquired' }));
    } else if (newEvent.event_type === 'service_complete') {
      setCurrentVehicle(prev => ({ ...prev, status: 'in_service' }));
    } else if (newEvent.event_type === 'ready_for_sale') {
      setCurrentVehicle(prev => ({ ...prev, status: 'ready_for_sale' }));
    } else if (newEvent.event_type === 'sold') {
      setCurrentVehicle(prev => ({ ...prev, status: 'sold' }));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <span className="mr-2">←</span> Back
        </button>
        <h1 className="text-2xl font-bold mt-2">
          {currentVehicle?.year} {currentVehicle?.make} {currentVehicle?.model}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Stock #</p>
                <p className="font-medium">{currentVehicle.stock_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">VIN</p>
                <p className="font-medium">{currentVehicle.vin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">{formatPrice(currentVehicle.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mileage</p>
                <p className="font-medium">{formatMileage(currentVehicle.mileage)} miles</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Color</p>
                <p className="font-medium">{currentVehicle.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Added</p>
                <p className="font-medium">{formatDate(currentVehicle.created_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleEditVehicle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Details
              </button>
              
              <button 
                onClick={handleAddEvent}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add Event
              </button>
              
              <button 
                onClick={() => {
                  // Find the most recent event for this vehicle
                  const latestEvent = events.length > 0 
                    ? events.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())[0]
                    : null;
                  
                  if (latestEvent) {
                    setSelectedEvent(latestEvent);
                    setIsCreatePostModalOpen(true);
                  } else {
                    alert('Please add an event first before creating a post.');
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                Create Post
              </button>
              
              <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : (
            <EventTimeline 
              events={events} 
              onAddEvent={handleAddEvent} 
            />
          )}
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Vehicle"
        size="lg"
      >
        <VehicleForm
          initialVehicle={currentVehicle}
          onSave={handleVehicleSaved}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title="Add Event"
        size="md"
      >
        <EventForm
          vehicleId={currentVehicle.id}
          onSave={handleEventSaved}
          onCancel={() => setIsAddEventModalOpen(false)}
        />
      </Modal>

      {/* Create Post Modal */}
      <Modal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        title="Create Social Media Post"
        size="lg"
      >
        {selectedEvent && (
          <CaptionManager 
            vehicle={currentVehicle}
            event={selectedEvent}
          />
        )}
      </Modal>
    </div>
  );
};

export default VehicleDetail;
