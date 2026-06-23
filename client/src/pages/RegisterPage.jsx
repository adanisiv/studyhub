import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', year: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="brand-icon">S</span>
            StudyHub
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join the student network and start collaborating</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <input className="form-input" name="name" value={form.name}
                onChange={handleChange} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input className="form-input" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@university.edu" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label>Department</label>
                <input className="form-input" name="department" value={form.department}
                  onChange={handleChange} placeholder="e.g. Computer Science" />
              </div>
              <div className="form-group">
                <label>Year</label>
                <select className="form-input" name="year" value={form.year} onChange={handleChange}>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)', padding: '12px' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
