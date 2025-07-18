import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface VinScannerProps {
  onVinCaptured?: (vin: string, vehicleData?: any) => void;
  onClose?: () => void;
}

const VinScanner: React.FC<VinScannerProps> = ({ onVinCaptured, onClose }) => {
  const [scanning, setScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualVin, setManualVin] = useState<string>('');
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Start the camera when component mounts
  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or use manual entry.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Here you would normally send this image to a VIN detection API
        // For now, we'll simulate finding a VIN
        simulateVinDetection();
      }
    }
  };

  const simulateVinDetection = () => {
    // In a real implementation, this would send the image to an OCR API
    // For now, we'll simulate a successful VIN detection after a delay
    setLoading(true);
    
    setTimeout(() => {
      // Generate a random VIN-like string for demonstration
      const mockVin = 'WBADT53472C' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      fetchVehicleData(mockVin);
    }, 1500);
  };

  const fetchVehicleData = async (vin: string) => {
    try {
      // In a real implementation, this would call the NHTSA API or similar
      // For now, we'll simulate fetching vehicle data
      
      // Example API call (commented out for now)
      // const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      // const data = await response.json();
      
      // Simulate API response
      const mockData = {
        make: 'BMW',
        model: '5 Series',
        year: '2022',
        trim: '530i',
        engine: '2.0L Turbo',
        transmission: 'Automatic',
        exteriorColor: 'Alpine White',
        fuelType: 'Gasoline'
      };
      
      setVehicleData(mockData);
      setLoading(false);
      
      // If callback provided, send the VIN and data back
      if (onVinCaptured) {
        onVinCaptured(vin, mockData);
      }
      
      // Stop scanning
      setScanning(false);
      
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError('Failed to fetch vehicle data. Please try again or use manual entry.');
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualVin.length >= 11) { // Minimum length for a valid VIN
      setLoading(true);
      fetchVehicleData(manualVin);
    } else {
      setError('Please enter a valid VIN (at least 11 characters)');
    }
  };

  const handleStartScanning = () => {
    setScanning(true);
    setError(null);
  };

  const handleClose = () => {
    stopCamera();
    if (onClose) {
      onClose();
    } else {
      navigate(-1); // Go back if no onClose provided
    }
  };

  return (
    <div className="vin-scanner">
      <div className="scanner-header">
        <h2>VIN Scanner</h2>
        <button onClick={handleClose} className="close-button">×</button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!scanning ? (
        <div className="scanner-options">
          <button 
            onClick={handleStartScanning} 
            className="scan-button"
            disabled={loading}
          >
            Scan VIN with Camera
          </button>
          
          <div className="manual-entry">
            <h3>Manual VIN Entry</h3>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                value={manualVin}
                onChange={(e) => setManualVin(e.target.value.toUpperCase())}
                placeholder="Enter VIN manually"
                disabled={loading}
              />
              <button type="submit" disabled={loading || manualVin.length < 11}>
                {loading ? 'Loading...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="camera-view">
          <video 
            ref={videoRef} 
            className="video-preview" 
            autoPlay 
            playsInline
          />
          <div className="scan-overlay">
            <div className="scan-target"></div>
          </div>
          <button 
            onClick={captureFrame} 
            className="capture-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Capture VIN'}
          </button>
          <button 
            onClick={() => setScanning(false)} 
            className="cancel-button"
          >
            Cancel
          </button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {vehicleData && (
        <div className="vehicle-data">
          <h3>Vehicle Information</h3>
          <div className="data-grid">
            <div className="data-row">
              <span className="label">Make:</span>
              <span className="value">{vehicleData.make}</span>
            </div>
            <div className="data-row">
              <span className="label">Model:</span>
              <span className="value">{vehicleData.model}</span>
            </div>
            <div className="data-row">
              <span className="label">Year:</span>
              <span className="value">{vehicleData.year}</span>
            </div>
            <div className="data-row">
              <span className="label">Trim:</span>
              <span className="value">{vehicleData.trim}</span>
            </div>
            <div className="data-row">
              <span className="label">Engine:</span>
              <span className="value">{vehicleData.engine}</span>
            </div>
            <div className="data-row">
              <span className="label">Transmission:</span>
              <span className="value">{vehicleData.transmission}</span>
            </div>
            <div className="data-row">
              <span className="label">Color:</span>
              <span className="value">{vehicleData.exteriorColor}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (onVinCaptured) {
                onVinCaptured(manualVin || 'SCANNED_VIN', vehicleData);
              }
              handleClose();
            }} 
            className="use-data-button"
          >
            Use This Information
          </button>
        </div>
      )}
    </div>
  );
};

export default VinScanner;
