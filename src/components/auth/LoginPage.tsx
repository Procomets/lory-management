import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isFirebaseActive } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      setSubmitting(true);
      await login(email.trim(), password);
    } catch (err: any) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Shield size={32} color="#0284c7" />
          </div>
          <h1 className="auth-title">Lory Management</h1>
          <p className="auth-subtitle">Welcome back! Sign in to access Lory ERP System</p>

          {!isFirebaseActive && (
            <div className="firebase-notice">
              <span className="notice-badge">Notice</span>
              <p>Firebase credentials not added yet. Testing locally!</p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="auth-alert error">
            <AlertCircle size={18} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="login-email">EMAIL ADDRESS</label>
            <div className="input-wrapper">
              <input
                id="login-email"
                type="email"
                placeholder="anand@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password">PASSWORD</label>
            <div className="input-wrapper">
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
