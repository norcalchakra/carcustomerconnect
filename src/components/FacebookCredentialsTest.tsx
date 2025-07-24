/**
 * Simple test component to verify Facebook credentials are working
 * This component only tests the connection without modifying existing functionality
 */

import React, { useState, useEffect } from 'react';
import { getCurrentAPIMode, testConnection, getUserPages } from '../lib/hybridFacebookApi';

const FacebookCredentialsTest: React.FC = () => {
  const [apiMode, setApiMode] = useState<'real' | 'mock'>('mock');
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [pages, setPages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFacebookIntegration = async () => {
      try {
        // Check which API mode we're using
        const mode = getCurrentAPIMode();
        setApiMode(mode);
        
        console.log(`Testing Facebook integration in ${mode} mode`);
        
        // Test the connection
        const isConnected = await testConnection();
        
        if (isConnected) {
          setConnectionStatus('connected');
          console.log('Facebook connection successful');
          
          // Try to fetch pages
          const userPages = await getUserPages();
          setPages(userPages);
          console.log('Facebook pages:', userPages);
        } else {
          setConnectionStatus('failed');
          setError('Facebook connection failed');
        }
      } catch (err) {
        console.error('Facebook test error:', err);
        setConnectionStatus('failed');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testFacebookIntegration();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Facebook Integration Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>API Mode:</strong> 
        <span style={{ 
          color: apiMode === 'real' ? 'green' : 'orange',
          marginLeft: '10px',
          fontWeight: 'bold'
        }}>
          {apiMode.toUpperCase()}
        </span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Connection Status:</strong> 
        <span style={{ 
          color: connectionStatus === 'connected' ? 'green' : 
                 connectionStatus === 'failed' ? 'red' : 'blue',
          marginLeft: '10px',
          fontWeight: 'bold'
        }}>
          {connectionStatus.toUpperCase()}
        </span>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {pages.length > 0 && (
        <div>
          <strong>Available Pages ({pages.length}):</strong>
          <ul style={{ marginTop: '5px' }}>
            {pages.map((page, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                <strong>{page.name}</strong> (ID: {page.id})
                {page.category && <span style={{ color: '#666' }}> - {page.category}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#e6f3ff', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Note:</strong> This test component verifies your Facebook credentials are working. 
        If you see "REAL" mode and "CONNECTED" status, your Facebook access token is valid and ready for posting.
      </div>
    </div>
  );
};

export default FacebookCredentialsTest;
