import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', year: 1 });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/register', form);
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <h1 className="page-title text-center">Create Account</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-input" name="name" value={form.name}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" name="email" type="email" value={form.email}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password (min 6 chars)</label>
            <input className="form-input" name="password" type="password" value={form.password}
              onChange={handleChange} required minLength={6} />
          </div>
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
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}>
            Register
          </button>
        </form>
        <p className="text-center mt-10 text-muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
