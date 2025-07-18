import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type HeaderProps = {};


const Header: React.FC<HeaderProps> = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <Link to="/" className="font-bold text-xl">
              Car Customer Connect
            </Link>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Link 
              to="/dashboard" 
              className="px-3 py-2 rounded hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link 
              to="/settings" 
              className="px-3 py-2 rounded hover:bg-blue-700"
            >
              Settings
            </Link>
            <Link 
              to="/facebook-test" 
              className="px-3 py-2 rounded hover:bg-blue-700"
            >
              FB Test
            </Link>
            <Link 
              to="/simple-facebook-test" 
              className="px-3 py-2 rounded hover:bg-blue-700"
            >
              Simple FB
            </Link>
            <Link 
              to="/vin-scanner" 
              className="px-3 py-2 rounded hover:bg-blue-700 bg-green-600"
            >
              VIN Scanner
            </Link>
            <Link 
              to="/dealer-onboarding" 
              className="px-3 py-2 rounded hover:bg-blue-700 bg-yellow-600"
            >
              Dealer Onboarding
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm">{user.email}</span>
              <Link 
                to="/captions" 
                className="px-3 py-2 rounded hover:bg-blue-700"
              >
                Captions
              </Link>
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
