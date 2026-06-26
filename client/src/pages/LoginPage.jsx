import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <svg className="brand-icon" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
              <path d="M12 4v16M4 9h16"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
            StudyHub
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to your study network</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" className="form-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
            </div>
            {error && <p className="error-text" role="alert">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)', padding: '12px' }} disabled={loading}>
              {loading ? <><span className="btn-spinner" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
