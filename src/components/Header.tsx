import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type HeaderProps = {};

const Header: React.FC<HeaderProps> = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="superhero-header daily-car-signal-masthead" style={{ position: 'relative', overflow: 'visible' }}>
      <div className="container mx-auto" style={{ overflow: 'visible' }}>
        {/* Top Banner - Bat Signal Style */}
        <div className="header-top-banner">
          <div className="bat-signal-container">
            <div className="bat-signal">🦇</div>
            <div className="signal-text">GOTHAM AUTO NETWORK</div>
          </div>
        </div>
        
        {/* Main Header Content */}
        <div className="header-main-content">
          {/* Logo/Title Section */}
          <div className="header-brand">
            <Link to="/" className="masthead-title-link">
              <div className="masthead-title">The Daily Car Signal</div>
              <div className="masthead-subtitle">Gotham's Premier Auto Intelligence</div>
            </Link>
          </div>
          
          {/* Navigation Menu */}
          <nav className="superhero-nav" style={{ overflow: 'visible', position: 'relative' }}>
            {/* Primary Mission Controls */}
            <div className="nav-section mission-control">
              <Link to="/dashboard" className="nav-button primary-mission" title="Command Center">
                <span className="nav-icon">🏢</span>
                <span className="nav-text">Command Center</span>
              </Link>
              <Link to="/workflow" className="nav-button workflow-mission" title="Vehicle Ops">
                <span className="nav-icon">⚡</span>
                <span className="nav-text">Vehicle Ops</span>
              </Link>
            </div>
            
            {/* Tools & Equipment */}
            <div className="nav-section tools-section">
              <Link to="/dealer-onboarding" className="nav-button onboarding-tool" title="HQ Setup">
                <span className="nav-icon">🎯</span>
                <span className="nav-text">HQ Setup</span>
              </Link>
              
              {/* VIN Scanner - Coming Soon */}
              <div 
                className="nav-button coming-soon" 
                title="VIN Scanner - Coming Soon"
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              >
                <span className="nav-icon">📱</span>
                <span className="nav-text">VIN Scanner</span>
                <span className="coming-soon-badge">SOON</span>
              </div>
            </div>
            
            {/* Admin & Settings */}
            <div className="nav-section admin-section" style={{ overflow: 'visible', position: 'relative' }}>
              <div className="dropdown-container" style={{ position: 'relative', overflow: 'visible' }}>
                <button 
                  className="nav-button admin-button"
                  title="Admin"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  onBlur={() => setTimeout(() => setShowAdminMenu(false), 200)}
                >
                  <span className="nav-icon">⚙️</span>
                  <span className="nav-text">Admin</span>
                  <span className="dropdown-arrow">{showAdminMenu ? '▲' : '▼'}</span>
                </button>
                
                {showAdminMenu && (
                  <div 
                    className="admin-dropdown"
                    style={{
                      position: 'fixed',
                      top: '120px',
                      right: '20px',
                      zIndex: 999999,
                      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                      border: '2px solid var(--comic-primary-yellow)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)',
                      minWidth: '200px'
                    }}
                  >
                    <Link to="/settings" className="dropdown-item">
                      <span className="dropdown-icon">🔧</span>
                      Settings
                    </Link>
                    <Link to="/privacy-policy" className="dropdown-item">
                      <span className="dropdown-icon">🛡️</span>
                      Privacy Policy
                    </Link>
                    <Link to="/data-deletion" className="dropdown-item">
                      <span className="dropdown-icon">🗑️</span>
                      Data Deletion
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
          
          {/* User Controls */}
          <div className="user-controls">
            {user && (
              <div className="user-section">
                <div className="user-badge">
                  <span className="user-icon">👤</span>
                  <span className="user-status">ACTIVE</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="logout-button"
                  title="Sign Out"
                >
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">Exit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
