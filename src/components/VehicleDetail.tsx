import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Vehicle, VehicleEvent, eventsApi, vehiclesApi } from '../lib/api';
import Modal from './ui/Modal';
import VehicleForm from './vehicles/VehicleForm';
import EventForm from './events/EventForm';
import EventTimeline from './events/EventTimeline';
import { CaptionManager } from './captions/CaptionManager';
import { useAuth } from '../context/AuthContext';

interface VehicleDetailProps {}

const VehicleDetail: React.FC<VehicleDetailProps> = () => {
  const { /* user not needed here */ } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const vehicleData = await vehiclesApi.getById(parseInt(id));
        setCurrentVehicle(vehicleData);
        
        // Fetch events for this vehicle
        const vehicleEvents = await eventsApi.getForVehicle(parseInt(id));
        setEvents(vehicleEvents);
      } catch (err) {
        console.error('Error fetching vehicle data:', err);
        setError('Failed to load vehicle data');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [id]);

  // Event handlers
  const handleBackClick = () => {
    navigate('/');
  };

  const handleEditVehicle = () => {
    setIsEditModalOpen(true);
  };

  const handleAddEvent = () => {
    setIsAddEventModalOpen(true);
  };

  const handleVehicleUpdated = (updatedVehicle: Vehicle) => {
    setCurrentVehicle(updatedVehicle);
    setIsEditModalOpen(false);
  };

  const handleUpdateStatus = async (newStatus: Vehicle['status']) => {
    if (!currentVehicle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update the vehicle status in the database
      await vehiclesApi.update(currentVehicle.id, { status: newStatus });
      
      // Update local state with proper type handling
      setCurrentVehicle(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus
        };
      });
      
      // Create an event for this status change
      // Make sure event_type is compatible with the API
      const eventType = newStatus === 'in_service' ? 'service_complete' : newStatus;
      await eventsApi.create({
        vehicle_id: currentVehicle.id,
        event_type: eventType,
        notes: `Vehicle status updated to ${newStatus}`,
        posted_to_facebook: false,
        posted_to_instagram: false,
        posted_to_google: false,
        post_id: null
      });
      
      // Refresh events
      const updatedEvents = await eventsApi.getForVehicle(currentVehicle.id);
      setEvents(updatedEvents);
    } catch (err) {
      console.error('Error updating vehicle status:', err);
      setError('Failed to update vehicle status');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !currentVehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error || 'Vehicle not found'}</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Dashboard
        </button>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => handleUpdateStatus('acquired')}
            className={`px-3 py-1 rounded ${currentVehicle?.status === 'acquired' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Acquired
          </button>
          <button
            onClick={() => handleUpdateStatus('in_service')}
            className={`px-3 py-1 rounded ${currentVehicle?.status === 'in_service' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            In Service
          </button>
          <button
            onClick={() => handleUpdateStatus('ready_for_sale')}
            className={`px-3 py-1 rounded ${currentVehicle?.status === 'ready_for_sale' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Ready for Sale
          </button>
          <button
            onClick={() => handleUpdateStatus('sold')}
            className={`px-3 py-1 rounded ${currentVehicle?.status === 'sold' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Sold
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackClick}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold">
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
          onSave={handleVehicleUpdated}
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
