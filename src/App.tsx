import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VehicleDetail from './components/VehicleDetail';
import Header from './components/Header';
import Auth from './components/auth/Auth';
import Settings from './pages/Settings';
import VinScannerPage from './pages/VinScannerPage';
import DealerOnboardingPage from './pages/DealerOnboardingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DataDeletion from './pages/DataDeletion';
import DataDeletionStatus from './pages/DataDeletionStatus';
import ActivityPage from './components/activity/ActivityPage';
import WorkflowDashboard from './components/vehicles/WorkflowDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import SocialPostCreationPage from './components/social/SocialPostCreationPage';
import { SocialPostDetail } from './components/social/SocialPostDetail';
import './App.css';

// Lazy load test components only in development
const FacebookTest = React.lazy(() => import('./pages/FacebookTest'));
const SimpleFacebookTest = React.lazy(() => import('./pages/SimpleFacebookTest'));
const RiddlerAnimationTest = React.lazy(() => import('./pages/RiddlerAnimationTest'));
const ActionBubbleTest = React.lazy(() => import('./pages/ActionBubbleTest'));
const ActionBubbleDebugTest = React.lazy(() => import('./pages/ActionBubbleDebugTest'));

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
      <div className="flex items-center justify-center h-screen comic-paper">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 comic-theme-foundation urban-skyline twinkling-lights comic-paper">
        {user && <Header />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/dashboard" element={<Navigate to="/" />} />
            <Route path="/workflow" element={<ProtectedRoute element={<WorkflowDashboard />} />} />
            <Route path="/workflow/:vehicleId" element={<ProtectedRoute element={<WorkflowDashboard />} />} />
            <Route path="/vehicles/:id" element={<ProtectedRoute element={<VehicleDetail />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="/vin-scanner" element={<ProtectedRoute element={<VinScannerPage />} />} />
            <Route path="/captions" element={<ProtectedRoute element={<SocialPostCreationPage />} />} />
            <Route path="/social/posts/:id" element={<ProtectedRoute element={<SocialPostDetail />} />} />
            <Route path="/dealer-onboarding" element={<ProtectedRoute element={<DealerOnboardingPage />} />} />
            <Route path="/activity" element={<ProtectedRoute element={<ActivityPage />} />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/data-deletion" element={<DataDeletion />} />
            <Route path="/data-deletion-status" element={<DataDeletionStatus />} />
            {/* Development-only test routes */}
            {import.meta.env.DEV && (
              <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
                <Route path="/facebook-test" element={<ProtectedRoute element={<FacebookTest />} />} />
                <Route path="/simple-facebook-test" element={<ProtectedRoute element={<SimpleFacebookTest />} />} />
                <Route path="/riddler-test" element={<RiddlerAnimationTest />} />
                <Route path="/action-bubble-test" element={<ActionBubbleTest />} />
                <Route path="/action-bubble-debug" element={<ActionBubbleDebugTest />} />
              </React.Suspense>
            )}
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
