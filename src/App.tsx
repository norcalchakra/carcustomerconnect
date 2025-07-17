import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import VehicleDetail from './components/VehicleDetail';
import Header from './components/Header';
import Auth from './components/auth/Auth';
import Settings from './pages/Settings';
import FacebookTest from './pages/FacebookTest';
import SimpleFacebookTest from './pages/SimpleFacebookTest';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'vehicle' | 'settings' | 'facebook-test' | 'simple-facebook-test'>('dashboard');
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
      <Header onNavigate={(view) => {
        setCurrentView(view);
        if (view !== 'vehicle') setSelectedVehicle(null);
      }} />
      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard onViewVehicle={handleViewVehicle} />
        )}
        
        {currentView === 'vehicle' && selectedVehicle && (
          <VehicleDetail 
            vehicle={selectedVehicle} 
            onBack={handleBackToDashboard} 
          />
        )}
        
        {currentView === 'settings' && (
          <Settings />
        )}
        
        {currentView === 'facebook-test' && (
          <FacebookTest />
        )}
        
        {currentView === 'simple-facebook-test' && (
          <SimpleFacebookTest />
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
