import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VehicleDetail from './components/VehicleDetail';
import Header from './components/Header';
import Auth from './components/auth/Auth';
import Settings from './pages/Settings';
import FacebookTest from './pages/FacebookTest';
import SimpleFacebookTest from './pages/SimpleFacebookTest';
import VinScannerPage from './pages/VinScannerPage';
import DealerOnboardingPage from './pages/DealerOnboardingPage';
import ActivityPage from './components/activity/ActivityPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocialPostForm } from './components/captions/SocialPostForm';
import { SocialPostDetail } from './components/social/SocialPostDetail';
import './App.css';

const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return user ? <>{element}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {user && <Header />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/dashboard" element={<Navigate to="/" />} />
            <Route path="/vehicles/:id" element={<ProtectedRoute element={<VehicleDetail />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="/facebook-test" element={<ProtectedRoute element={<FacebookTest />} />} />
            <Route path="/simple-facebook-test" element={<ProtectedRoute element={<SimpleFacebookTest />} />} />
            <Route path="/vin-scanner" element={<ProtectedRoute element={<VinScannerPage />} />} />
            <Route path="/captions" element={<ProtectedRoute element={<SocialPostForm caption={{ id: 0, content: '', vehicle_id: 0, event_id: 0, hashtags: [] }} />} />} />
            <Route path="/social/posts/:id" element={<ProtectedRoute element={<SocialPostDetail />} />} />
            <Route path="/dealer-onboarding" element={<ProtectedRoute element={<DealerOnboardingPage />} />} />
            <Route path="/activity" element={<ProtectedRoute element={<ActivityPage />} />} />
          </Routes>
        </main>
      </div>
    </Router>
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
