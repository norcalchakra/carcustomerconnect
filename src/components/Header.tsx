import React from 'react';
import { useAuth } from '../context/AuthContext';

type HeaderProps = {
  onNavigate: (view: 'dashboard' | 'settings' | 'vehicle' | 'facebook-test' | 'simple-facebook-test' | 'vin-scanner') => void;
};

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => onNavigate('dashboard')}>Car Customer Connect</h1>
          <nav className="hidden md:flex space-x-4">
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="text-white hover:text-blue-200 text-sm font-medium"
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('settings')} 
              className="text-white hover:text-blue-200 text-sm font-medium"
            >
              Settings
            </button>
            <button 
              onClick={() => onNavigate('facebook-test')} 
              className="text-white hover:text-blue-200 text-sm font-medium"
            >
              Facebook Test
            </button>
            <button 
              onClick={() => onNavigate('simple-facebook-test')} 
              className="text-white hover:text-blue-200 text-sm font-medium"
            >
              Simple FB Test
            </button>
            <button 
              onClick={() => onNavigate('vin-scanner')} 
              className="text-white hover:text-blue-200 text-sm font-medium bg-green-600 px-3 py-1 rounded"
            >
              VIN Scanner
            </button>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="bg-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-800"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
