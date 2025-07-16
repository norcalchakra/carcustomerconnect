import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleEvent, eventsApi } from '../lib/api';
import Modal from './ui/Modal';
import VehicleForm from './vehicles/VehicleForm';
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

  // Event type helpers
  const getEventTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'acquisition': 'Vehicle Acquired',
      'service_complete': 'Service Completed',
      'ready_for_sale': 'Listed for Sale',
      'sold': 'Vehicle Sold'
    };
    return types[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'acquisition': 'border-blue-500',
      'service_complete': 'border-purple-500',
      'ready_for_sale': 'border-green-500',
      'sold': 'border-red-500'
    };
    return colors[type] || 'border-gray-500';
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
              
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center">
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
          <h2 className="text-xl font-semibold mb-4">Lifecycle Events</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-gray-600">No events recorded yet</p>
              <button 
                onClick={handleAddEvent}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Add First Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className={`border-l-4 ${getEventTypeColor(event.event_type)} pl-4 py-2`}>
                  <p className="font-medium">{getEventTypeDisplay(event.event_type)}</p>
                  <p className="text-sm text-gray-500">{formatDate(event.created_at)}</p>
                  {event.notes && <p className="text-sm mt-1">{event.notes}</p>}
                </div>
              ))}
            </div>
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

      {/* Add Event Modal - Placeholder for now */}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title="Add Event"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="acquisition">Vehicle Acquired</option>
              <option value="service_complete">Service Completed</option>
              <option value="ready_for_sale">Listed for Sale</option>
              <option value="sold">Vehicle Sold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              rows={3} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any relevant details about this event..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              onClick={() => setIsAddEventModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                // In a real app, we'd save the event here
                setIsAddEventModalOpen(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Event
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehicleDetail;
