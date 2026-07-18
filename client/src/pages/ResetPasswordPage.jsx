import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/common/Toast';

// Shared auth-page chrome (logo, title, card, footer) — the three states
// below (no token / form / success) only differ in what goes inside.
function AuthShell({ title, subtitle, children }) {
  const { t } = useLanguage();
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
          {title && <h1 className="auth-title">{title}</h1>}
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        <div className="auth-card">{children}</div>
        <div className="auth-footer">
          <Link to="/login">{t('backToLogin')}</Link>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('confirmPassword'));
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      toast(t('passwordResetSuccessTitle'), 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      setError(msg);
      toast(msg, 'error');
    }
    setLoading(false);
  };

  // No token in the URL at all — nothing to reset, don't show a form
  if (!token) {
    return (
      <AuthShell title={t('invalidResetLinkTitle')} subtitle={t('invalidResetLinkDesc')}>
        <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
          {t('requestNewLink')}
        </Link>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title={t('passwordResetSuccessTitle')} subtitle={t('passwordResetSuccessDesc')}>
        <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => navigate('/login')}>
          {t('goToLogin')}
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('resetPasswordTitle')} subtitle={t('resetPasswordSubtitle')}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reset-new-password">{t('newPassword')}</label>
          <div style={{ position: 'relative' }}>
            <input
              id="reset-new-password"
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t('minChars')}
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4 }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reset-confirm-password">{t('confirmPassword')}</label>
          <input
            id="reset-confirm-password"
            className="form-input"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder={t('minChars')}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 'var(--space-4)', padding: '12px' }}
          disabled={loading}
        >
          {loading ? <><span className="btn-spinner" /> {t('resettingPassword')}</> : t('resetPasswordButton')}
        </button>
      </form>
    </AuthShell>
  );
}

export default ResetPasswordPage;
