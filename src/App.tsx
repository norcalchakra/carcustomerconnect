import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import VehicleDetail from './components/VehicleDetail';
import Header from './components/Header';
import './App.css';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'vehicle'>('dashboard');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleViewVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentView('vehicle');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedVehicle(null);
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {currentView === 'dashboard' ? (
          <Dashboard onViewVehicle={handleViewVehicle} />
        ) : (
          <VehicleDetail 
            vehicle={selectedVehicle} 
            onBack={handleBackToDashboard} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
