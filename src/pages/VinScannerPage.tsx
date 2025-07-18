import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VinScanner from '../components/vehicles/VinScanner';
import '../components/vehicles/VinScanner.css';

const VinScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [scanComplete, setScanComplete] = useState(false);
  
  const handleVinCaptured = (vin: string, vehicleData: any) => {
    console.log('VIN captured:', vin);
    console.log('Vehicle data:', vehicleData);
    
    // Store the captured data in session storage to use in the vehicle form
    sessionStorage.setItem('scannedVin', vin);
    sessionStorage.setItem('scannedVehicleData', JSON.stringify(vehicleData));
    
    setScanComplete(true);
    
    // Navigate to the vehicle form after a short delay
    setTimeout(() => {
      navigate('/add-vehicle');
    }, 1500);
  };
  
  return (
    <div className="page-container">
      <div className="page-content">
        {scanComplete ? (
          <div className="success-message">
            <h2>VIN Scanned Successfully!</h2>
            <p>Redirecting to vehicle form...</p>
          </div>
        ) : (
          <>
            <h1>Scan Vehicle VIN</h1>
            <p className="page-description">
              Use your camera to scan a vehicle's VIN barcode or enter it manually.
              The system will automatically fetch vehicle details.
            </p>
            <VinScanner onVinCaptured={handleVinCaptured} />
          </>
        )}
      </div>
    </div>
  );
};

export default VinScannerPage;
