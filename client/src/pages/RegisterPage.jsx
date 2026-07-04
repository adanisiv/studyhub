import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';

function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    year: 1
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

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
            <svg className="brand-icon" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
              <path d="M12 4v16M4 9h16"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
            StudyHub
          </div>
          <h1 className="auth-title">{t('createAccount')}</h1>
          <p className="auth-subtitle">{t('registerSubtitle')}</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reg-name">{t('fullName')}</label>
              <input id="reg-name" className="form-input" name="name" value={form.name}
                onChange={handleChange} placeholder={t('fullNamePlaceholder')} required autoComplete="name" />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">{t('emailAddress')}</label>
              <input id="reg-email" className="form-input" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@university.edu" required autoComplete="email" />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">{t('password')}</label>
              <input id="reg-password" className="form-input" name="password" type="password" value={form.password}
                onChange={handleChange} placeholder={t('minChars')} required minLength={6} autoComplete="new-password" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label htmlFor="reg-department">{t('department')}</label>
                <input id="reg-department" className="form-input" name="department" value={form.department}
                  onChange={handleChange} placeholder={t('deptPlaceholder')} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-year">{t('year')}</label>
                <select id="reg-year" className="form-input" name="year" value={form.year} onChange={handleChange}>
                  {[1,2,3,4].map(y => <option key={y} value={y}>{t('year')} {y}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="error-text" role="alert">{error}</p>}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-4)', padding: '12px' }}
              disabled={loading}
            >
              {loading ? <><span className="btn-spinner" /> {t('creatingAccount')}</> : t('createAccount')}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          {t('haveAccount')} <Link to="/login">{t('signIn')}</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
