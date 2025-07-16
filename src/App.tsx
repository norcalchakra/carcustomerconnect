import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import VehicleDetail from './components/VehicleDetail';
import Header from './components/Header';
import Auth from './components/auth/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user is logged in, show the authentication screen
  if (!user) {
    return <Auth />;
  }

  // User is logged in, show the main application
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
