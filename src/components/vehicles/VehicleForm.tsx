import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleInsert, vehiclesApi, dealershipApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface VehicleFormProps {
  initialVehicle?: Vehicle;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ initialVehicle, onSave, onCancel }) => {
  const [vehicle, setVehicle] = useState<Partial<VehicleInsert>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    stock_number: '',
    price: 0,
    mileage: 0,
    color: '',
    status: 'acquired',
    dealership_id: undefined, // Will be set after fetching the user's dealership
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (initialVehicle) {
      setVehicle({
        make: initialVehicle.make,
        model: initialVehicle.model,
        year: initialVehicle.year,
        vin: initialVehicle.vin,
        stock_number: initialVehicle.stock_number,
        price: initialVehicle.price,
        mileage: initialVehicle.mileage,
        color: initialVehicle.color,
        status: initialVehicle.status,
        dealership_id: initialVehicle.dealership_id,
      });
    }
  }, [initialVehicle]);

  // Fetch the user's dealership ID when component mounts
  useEffect(() => {
    const fetchDealershipId = async () => {
      if (user) {
        try {
          // Use the known dealership ID (4) directly if available
          const knownDealershipId = 4;
          
          console.log('Fetching dealership for user:', user.id);
          const dealership = await dealershipApi.getByUserId(user.id);
          
          if (dealership) {
            console.log('Found dealership:', dealership);
            setVehicle(prev => {
              console.log('Setting dealership_id to:', dealership.id);
              return { ...prev, dealership_id: dealership.id };
            });
          } else {
            console.log('No dealership found, using known ID:', knownDealershipId);
            setVehicle(prev => ({ ...prev, dealership_id: knownDealershipId }));
          }
        } catch (err) {
          console.error('Error fetching dealership:', err);
          // Fallback to known dealership ID
          const knownDealershipId = 4;
          console.log('Using fallback dealership ID:', knownDealershipId);
          setVehicle(prev => ({ ...prev, dealership_id: knownDealershipId }));
          setError(err instanceof Error ? err.message : 'Failed to fetch dealership information');
        }
      }
    };

    if (!initialVehicle && !vehicle.dealership_id) {
      fetchDealershipId();
    }
  }, [user, initialVehicle, vehicle.dealership_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'year' || name === 'price' || name === 'mileage') {
      setVehicle(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setVehicle(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!vehicle.dealership_id) {
      setError('No dealership ID available. Please refresh the page or contact support.');
      setLoading(false);
      return;
    }
    
    try {
      let savedVehicle: Vehicle;
      
      if (initialVehicle?.id) {
        // Update existing vehicle
        savedVehicle = await vehiclesApi.update(initialVehicle.id, vehicle);
      } else {
        // Create new vehicle
        savedVehicle = await vehiclesApi.create(vehicle as VehicleInsert);
      }
      
      onSave(savedVehicle);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {initialVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make
            </label>
            <input
              type="text"
              name="make"
              value={vehicle.make}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={vehicle.model}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={vehicle.year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VIN
            </label>
            <input
              type="text"
              name="vin"
              value={vehicle.vin}
              onChange={handleChange}
              maxLength={17}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Number
            </label>
            <input
              type="text"
              name="stock_number"
              value={vehicle.stock_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              name="price"
              value={vehicle.price}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage
            </label>
            <input
              type="number"
              name="mileage"
              value={vehicle.mileage}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={vehicle.color}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={vehicle.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="acquired">Acquired</option>
              <option value="in_service">In Service</option>
              <option value="ready_for_sale">Ready for Sale</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Saving...' : initialVehicle ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
