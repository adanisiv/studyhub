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
            <span className="brand-icon" aria-hidden="true">S</span>
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
