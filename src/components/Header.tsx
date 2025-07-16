import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
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
        <h1 className="text-xl font-bold">Car Customer Connect</h1>
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
