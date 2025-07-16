import React from 'react';

interface VehicleDetailProps {
  vehicle: any;
  onBack: () => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack }) => {
  // Mock data for demonstration
  const vehicleDetails = {
    vin: '1FMSK8DH6MGA12345',
    stockNumber: 'A2341',
    price: '$32,995',
    mileage: '34,521',
    color: 'Oxford White',
    events: [
      { name: 'Acquired', date: '01/15/25', posted: true, platforms: ['FB', 'IG'] },
      { name: 'Service Complete', date: '01/18/25', posted: true, platforms: ['FB'] },
      { name: 'Ready for Sale', date: '', posted: false, platforms: [] },
      { name: 'Sold', date: '', posted: false, platforms: [] },
    ],
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
          {vehicle?.year} {vehicle?.make} {vehicle?.model}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Vehicle Photo</span>
            </div>
          </div>
          <div className="w-full md:w-2/3 md:pl-6">
            <div className="flex justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>Ready for Sale</option>
                  <option>In Service</option>
                  <option>Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">VIN</label>
                <p>{vehicleDetails.vin}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Stock #</label>
                <p>{vehicleDetails.stockNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Price</label>
                <p>{vehicleDetails.price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Mileage</label>
                <p>{vehicleDetails.mileage}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Color</label>
                <p>{vehicleDetails.color}</p>
              </div>
            </div>

            <div className="mt-4">
              <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200">
                Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Lifecycle Events</h2>
        <ul className="space-y-3">
          {vehicleDetails.events.map((event, index) => (
            <li key={index} className="flex items-start">
              <span className={`mt-1 mr-2 ${event.posted ? 'text-green-500' : 'text-gray-400'}`}>
                {event.posted ? '✓' : event.date ? '→' : '○'}
              </span>
              <div>
                <p className="font-medium">
                  {event.name} {event.date && `- ${event.date}`}
                </p>
                {event.posted && (
                  <p className="text-sm text-gray-500">
                    Posted to: {event.platforms.join(', ')}
                  </p>
                )}
                {!event.posted && event.date && (
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Create Post
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex space-x-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Post
        </button>
        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
          View All Posts
        </button>
        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
          Print Window Sticker
        </button>
      </div>
    </div>
  );
};

export default VehicleDetail;
