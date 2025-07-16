import React from 'react';

interface DashboardProps {
  onViewVehicle: (vehicle: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewVehicle }) => {
  // Mock data for demonstration
  const mockVehicles = [
    {
      id: 1,
      year: 2021,
      make: 'Ford',
      model: 'F-150',
      status: 'active',
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      year: 2019,
      make: 'Honda',
      model: 'Civic',
      status: 'pending',
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: 3,
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      status: 'sold',
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    },
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ready for Sale';
      case 'pending':
        return 'Just Traded In';
      case 'sold':
        return 'Sold!';
      default:
        return status;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000));
    if (hours < 24) {
      return `${hours} hrs ago`;
    }
    return 'Yesterday';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Add Vehicle
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="border rounded-md px-4 py-2 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h3 className="text-lg font-medium text-gray-500">ACTIVE</h3>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h3 className="text-lg font-medium text-gray-500">PENDING</h3>
          <p className="text-3xl font-bold">8</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h3 className="text-lg font-medium text-gray-500">SOLD</h3>
          <p className="text-3xl font-bold">156</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold p-4 border-b">Recent Activity</h2>
        <ul className="divide-y">
          {mockVehicles.map((vehicle) => (
            <li 
              key={vehicle.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onViewVehicle(vehicle)}
            >
              <p>
                • {vehicle.year} {vehicle.make} {vehicle.model} - {getStatusText(vehicle.status)} ({formatTimeAgo(vehicle.updatedAt)})
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-4 border-b">Quick Actions</h2>
        <div className="p-4 flex space-x-4">
          <button className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
            Scan VIN
          </button>
          <button className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
            Bulk Import
          </button>
          <button className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
            View Posts
          </button>
          <button className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
            Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
