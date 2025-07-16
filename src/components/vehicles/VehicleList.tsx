import React, { useState, useEffect } from 'react';
import { Vehicle, vehiclesApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface VehicleListProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: () => void;
}

const VehicleList: React.FC<VehicleListProps> = ({ onSelectVehicle, onAddVehicle }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [counts, setCounts] = useState({
    acquired: 0,
    in_service: 0,
    ready_for_sale: 0,
    sold: 0
  });

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // In a real app, this would come from the authenticated user's dealership
        const dealershipId = 1;
        const data = await vehiclesApi.getAll(dealershipId);
        setVehicles(data);
        setFilteredVehicles(data);
        
        // Get counts by status
        const statusCounts = await vehiclesApi.countByStatus(dealershipId);
        setCounts(statusCounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVehicles();
    }
  }, [user]);

  // Filter vehicles based on search term and status
  useEffect(() => {
    let filtered = vehicles;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        vehicle => 
          vehicle.make.toLowerCase().includes(term) ||
          vehicle.model.toLowerCase().includes(term) ||
          vehicle.vin.toLowerCase().includes(term) ||
          vehicle.stock_number.toLowerCase().includes(term) ||
          vehicle.color.toLowerCase().includes(term)
      );
    }
    
    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter]);

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format mileage with commas
  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  // Get status display name
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'acquired': return 'Acquired';
      case 'in_service': return 'In Service';
      case 'ready_for_sale': return 'Ready for Sale';
      case 'sold': return 'Sold';
      default: return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acquired': return 'bg-yellow-100 text-yellow-800';
      case 'in_service': return 'bg-blue-100 text-blue-800';
      case 'ready_for_sale': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error: {error}</p>
        <button 
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Vehicle button and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <button
          onClick={onAddVehicle}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Vehicle
        </button>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Status Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`py-3 px-4 rounded-lg text-center ${
            statusFilter === 'all' ? 'bg-gray-200 font-medium' : 'bg-gray-100'
          }`}
        >
          <div className="text-lg font-semibold">All</div>
          <div className="text-2xl font-bold">{vehicles.length}</div>
        </button>
        
        <button
          onClick={() => setStatusFilter('acquired')}
          className={`py-3 px-4 rounded-lg text-center ${
            statusFilter === 'acquired' ? 'bg-yellow-200 font-medium' : 'bg-yellow-100'
          }`}
        >
          <div className="text-lg font-semibold">Acquired</div>
          <div className="text-2xl font-bold">{counts.acquired}</div>
        </button>
        
        <button
          onClick={() => setStatusFilter('in_service')}
          className={`py-3 px-4 rounded-lg text-center ${
            statusFilter === 'in_service' ? 'bg-blue-200 font-medium' : 'bg-blue-100'
          }`}
        >
          <div className="text-lg font-semibold">In Service</div>
          <div className="text-2xl font-bold">{counts.in_service}</div>
        </button>
        
        <button
          onClick={() => setStatusFilter('ready_for_sale')}
          className={`py-3 px-4 rounded-lg text-center ${
            statusFilter === 'ready_for_sale' ? 'bg-green-200 font-medium' : 'bg-green-100'
          }`}
        >
          <div className="text-lg font-semibold">Ready</div>
          <div className="text-2xl font-bold">{counts.ready_for_sale}</div>
        </button>
        
        <button
          onClick={() => setStatusFilter('sold')}
          className={`py-3 px-4 rounded-lg text-center ${
            statusFilter === 'sold' ? 'bg-purple-200 font-medium' : 'bg-purple-100'
          }`}
        >
          <div className="text-lg font-semibold">Sold</div>
          <div className="text-2xl font-bold">{counts.sold}</div>
        </button>
      </div>
      
      {/* Vehicle List */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p className="mt-4 text-xl text-gray-600">No vehicles found</p>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIN
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mileage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => (
                <tr 
                  key={vehicle.id} 
                  onClick={() => onSelectVehicle(vehicle)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">{vehicle.color}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.stock_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.vin}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPrice(vehicle.price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatMileage(vehicle.mileage)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusDisplay(vehicle.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VehicleList;
