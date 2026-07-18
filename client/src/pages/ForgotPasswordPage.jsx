import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/common/Toast';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // devResetToken is only present because this project has no email server —
  // see the comment on authController.forgotPassword for why that's a
  // demo-only shortcut and not something a production app would do.
  const [devResetToken, setDevResetToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setDevResetToken(res.data.devResetToken || null);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      setError(msg);
      toast(msg, 'error');
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
          <h1 className="auth-title">{t('forgotPasswordTitle')}</h1>
          <p className="auth-subtitle">{t('forgotPasswordSubtitle')}</p>
        </div>

        <div className="auth-card">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="forgot-email">{t('emailAddress')}</label>
                <input
                  id="forgot-email"
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && <p className="error-text" role="alert">{error}</p>}

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-4)', padding: '12px' }}
                disabled={loading}
              >
                {loading ? <><span className="btn-spinner" /> {t('sending')}</> : t('sendResetLink')}
              </button>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: devResetToken ? 'var(--space-4)' : 0 }}>
                {t('resetRequestSentTitle')}
              </p>

              {devResetToken && (
                <div style={{
                  background: 'var(--warning-bg)', border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
                }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                    {t('resetRequestSentDevNote')}
                  </p>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(devResetToken)}`}
                    className="btn btn-primary btn-small"
                    style={{ width: '100%' }}
                  >
                    {t('continueToReset')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="auth-footer">
          <Link to="/login">{t('backToLogin')}</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
