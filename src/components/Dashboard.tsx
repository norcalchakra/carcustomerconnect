import React, { useState, useEffect } from 'react';
import VehicleList from './vehicles/VehicleList';
import VehicleForm from './vehicles/VehicleForm';
import Modal from './ui/Modal';
import { Vehicle, VehicleEvent, vehiclesApi, eventsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onViewVehicle: (vehicle: Vehicle) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewVehicle }) => {
  const { user } = useAuth();
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    vehicle: string;
    status: string;
    time: string;
  }>>([]);
  
  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // In a real app, we'd fetch this from the API
        // For now, using mock data
        setRecentActivity([
          { id: 1, vehicle: '2021 Ford F-150', status: 'Ready for Sale', time: '2 hrs ago' },
          { id: 2, vehicle: '2019 Honda Civic', status: 'Just Traded In', time: '4 hrs ago' },
          { id: 3, vehicle: '2020 Toyota Camry', status: 'Sold', time: 'Yesterday' },
        ]);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };

    if (user) {
      fetchRecentActivity();
    }
  }, [user]);

  const handleAddVehicle = () => {
    setIsAddVehicleModalOpen(true);
  };

  const handleVehicleSaved = (vehicle: Vehicle) => {
    setIsAddVehicleModalOpen(false);
    // In a real app, we'd refresh the vehicle list here
    // For now, just close the modal
  };

  return (
    <div className="p-4">
      {/* Vehicle List with Status Filters */}
      <VehicleList 
        onSelectVehicle={onViewVehicle} 
        onAddVehicle={handleAddVehicle} 
      />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentActivity.map(activity => (
                <li key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="font-medium">{activity.vehicle} - {activity.status}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        // In a real app, we'd find the actual vehicle
                        // For now, just show a mock vehicle
                        const mockVehicle = {
                          id: activity.id,
                          year: 2021,
                          make: activity.vehicle.split(' ')[1],
                          model: activity.vehicle.split(' ')[2] || 'XLT',
                          vin: '1FMSK8DH6MGA12345',
                          stock_number: `A${activity.id}341`,
                          price: 32995,
                          mileage: 34521,
                          color: 'Oxford White',
                          status: activity.status === 'Ready for Sale' ? 'ready_for_sale' : 
                                  activity.status === 'Just Traded In' ? 'acquired' : 'sold',
                          dealership_id: 1,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        } as Vehicle;
                        onViewVehicle(mockVehicle);
                      }}
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mt-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <span className="block mt-2">Scan VIN</span>
          </button>
          
          <button className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            <span className="block mt-2">Bulk Import</span>
          </button>
          
          <button className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="block mt-2">View Posts</span>
          </button>
          
          <button className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="block mt-2">Analytics</span>
          </button>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Add New Vehicle"
        size="lg"
      >
        <VehicleForm
          onSave={handleVehicleSaved}
          onCancel={() => setIsAddVehicleModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
