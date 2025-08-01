import React, { useState } from 'react';
import { authApi } from '../../lib/api';
import './Auth.css';

type AuthMode = 'signin' | 'signup' | 'reset';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await authApi.signUp(email, password);
        setMessage('Sign up successful! Please check your email for verification.');
      } else if (mode === 'signin') {
        await authApi.signIn(email, password);
        // Successful login will redirect or update state elsewhere
      } else if (mode === 'reset') {
        // This would call a password reset function
        // await authApi.resetPassword(email);
        setMessage('If your email exists in our system, you will receive a password reset link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="superhero-auth-container">
      {/* Comic Book Background with Superhero Cars */}
      <div className="comic-background">
        <div className="batmobile-silhouette batmobile-1">🦇</div>
        <div className="batmobile-silhouette batmobile-2">🚗</div>
        <div className="superhero-car superhero-car-1">🏎️</div>
        <div className="superhero-car superhero-car-2">🚙</div>
        <div className="comic-burst comic-burst-1">💥</div>
        <div className="comic-burst comic-burst-2">⚡</div>
        <div className="comic-burst comic-burst-3">💫</div>
      </div>
      
      {/* Main Auth Panel */}
      <div className="auth-panel">
        {/* Hero Header */}
        <div className="auth-header">
          <div className="bat-signal-auth">🦇</div>
          <h1 className="auth-title">GOTHAM AUTO NETWORK</h1>
          <h2 className="auth-subtitle">
            {mode === 'signin' ? 'ENTER THE BATCAVE' : 
             mode === 'signup' ? 'JOIN THE LEAGUE' : 
             'RECOVER ACCESS'}
          </h2>
          <div className="auth-tagline">
            {mode === 'signin' ? 'Access your command center' : 
             mode === 'signup' ? 'Become a superhero dealer' : 
             'Restore your powers'}
          </div>
        </div>
        
        {/* Alert Messages with Comic Style */}
        {error && (
          <div className="comic-alert comic-alert-danger">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}
        
        {message && (
          <div className="comic-alert comic-alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-text">{message}</span>
          </div>
        )}
        
        {/* Superhero Form */}
        <form className="superhero-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <div className="input-group">
              <label htmlFor="email-address" className="field-label">
                <span className="label-icon">📧</span>
                Hero Identity (Email)
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="superhero-input"
                placeholder="Enter your hero email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {mode !== 'reset' && (
              <div className="input-group">
                <label htmlFor="password" className="field-label">
                  <span className="label-icon">🔐</span>
                  Secret Code (Password)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="superhero-input"
                  placeholder="Enter your secret code..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            
            {mode === 'signup' && (
              <div className="input-group">
                <label htmlFor="confirm-password" className="field-label">
                  <span className="label-icon">🔒</span>
                  Confirm Secret Code
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="superhero-input"
                  placeholder="Confirm your secret code..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="form-actions">
            {mode === 'signin' && (
              <button 
                type="button"
                className="action-link"
                onClick={() => setMode('reset')}
              >
                <span className="link-icon">🔑</span>
                Lost your powers?
              </button>
            )}
            
            <button 
              type="button"
              className="action-link"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <span className="link-icon">{mode === 'signin' ? '🦸‍♂️' : '🏠'}</span>
              {mode === 'signin' ? 'Join the League' : 'Return to Base'}
            </button>
          </div>

          {/* Hero Action Button */}
          <div className="hero-button-container">
            <button
              type="submit"
              disabled={loading}
              className={`hero-button ${loading ? 'hero-button-loading' : ''}`}
            >
              <span className="button-icon">
                {loading ? '⚡' : 
                 mode === 'signin' ? '🦇' : 
                 mode === 'signup' ? '🌟' : 
                 '🔧'}
              </span>
              <span className="button-text">
                {loading ? 'ACTIVATING...' : 
                 mode === 'signin' ? 'ENTER BATCAVE' : 
                 mode === 'signup' ? 'JOIN LEAGUE' : 
                 'RESTORE POWER'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
