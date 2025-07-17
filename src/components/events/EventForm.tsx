import React, { useState } from 'react';
import { VehicleEvent, VehicleEventInsert, eventsApi } from '../../lib/api';

interface EventFormProps {
  vehicleId: number;
  initialEvent?: VehicleEvent;
  onSave: (event: VehicleEvent) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ vehicleId, initialEvent, onSave, onCancel }) => {
  const [event, setEvent] = useState<Partial<VehicleEventInsert>>({
    vehicle_id: vehicleId,
    event_type: initialEvent?.event_type || 'acquired',
    notes: initialEvent?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventTypes = [
    { value: 'acquired', label: 'Acquired' },
    { value: 'service_complete', label: 'Service Complete' },
    { value: 'ready_for_sale', label: 'Ready for Sale' },
    { value: 'sold', label: 'Sold' }
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // We're only handling creation for now since events typically aren't edited
      const savedEvent = await eventsApi.create(event as VehicleEventInsert);
      onSave(savedEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {initialEvent ? 'Edit Event' : 'Add New Event'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <select
            name="event_type"
            value={event.event_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={event.notes || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
