import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const TYPE_ICON = {
  like: '❤️',
  comment: '💬',
  friend_request: '🤝',
  group_join: '👥',
  group_approved: '✅',
};

function Navbar({ user, onLogout, notifications, unreadCount, onMarkAllRead, onDeleteNotification, activity }) {
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState('notifications'); // 'notifications' | 'activity'

  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Close the notification panel when Escape is pressed
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setNotifOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [notifOpen]);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Convert a timestamp to human-readable relative time (e.g. "5m ago")
  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const initial = user.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">

          <Link to="/" className="navbar-brand">
            <svg className="brand-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
              <path d="M12 4v16M4 9h16"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
            StudyHub
          </Link>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`} role="menubar">
            <Link to="/" className={isActive('/')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              {t('feed')}
            </Link>
            <Link to="/groups" className={isActive('/groups')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              {t('groups')}
            </Link>
            <Link to="/search" className={isActive('/search')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              {t('search')}
            </Link>
            <Link to="/stats" className={isActive('/stats')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              {t('stats')}
            </Link>
            <Link to={`/profile/${user._id}`} className="nav-user-btn" aria-label={`Profile for ${user.name}`}>
              <span className="nav-user-avatar" aria-hidden="true" style={{ overflow: 'hidden', padding: 0, background: user.avatar ? 'transparent' : undefined }}>
                {user.avatar
                  ? <img
                      src={user.avatar}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = initial; e.currentTarget.parentElement.style.background = ''; }}
                    />
                  : initial
                }
              </span>
              {user.name?.split(' ')[0]}
              {user.role === 'admin' && <span className="admin-badge">{t('admin')}</span>}
            </Link>
          </div>

          <div className="nav-actions">
            {/* Bell icon — shows unread badge, opens notification panel */}
            <button
              className="nav-icon-btn"
              onClick={() => setNotifOpen(true)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-haspopup="dialog"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unreadCount > 0 && <span className="notification-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            <button className="nav-icon-btn" onClick={toggleDark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
            </button>

            {/* Language toggle: IL flag for Hebrew, EN for English */}
            <button
              className="btn btn-small btn-ghost"
              onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-xs)', minWidth: 36 }}
              aria-label="Toggle language"
              title={lang === 'he' ? 'Switch to English' : 'עבור לעברית'}
            >
              {lang === 'he' ? 'EN' : 'עב'}
            </button>

            <button className="btn btn-small btn-ghost" onClick={onLogout} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--text-xs)' }} aria-label="Log out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Notification / Activity Center ─────────────────────────────── */}
      <div
        className={`notif-center-overlay ${notifOpen ? 'open' : ''}`}
        onClick={() => setNotifOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`notif-center-panel ${notifOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Notification center"
      >
        {/* Header */}
        <div className="notif-center-header">
          <span className="notif-center-title">
            {notifTab === 'notifications' ? t('notifications') : t('activity')}
            {notifTab === 'notifications' && unreadCount > 0 && (
              <span className="notification-badge" style={{ marginLeft: 8, position: 'static', display: 'inline-flex' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <button className="nav-icon-btn" onClick={() => setNotifOpen(false)} aria-label="Close" style={{ color: 'var(--text-tertiary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs — Notifications / Activity */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 var(--space-4)',
        }}>
          <button
            onClick={() => setNotifTab('notifications')}
            style={{
              flex: 1,
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-sm)',
              fontWeight: notifTab === 'notifications' ? 600 : 400,
              color: notifTab === 'notifications' ? 'var(--accent)' : 'var(--text-tertiary)',
              background: 'none',
              border: 'none',
              borderBottom: notifTab === 'notifications' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {t('notifications')}
          </button>
          <button
            onClick={() => setNotifTab('activity')}
            style={{
              flex: 1,
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-sm)',
              fontWeight: notifTab === 'activity' ? 600 : 400,
              color: notifTab === 'activity' ? 'var(--accent)' : 'var(--text-tertiary)',
              background: 'none',
              border: 'none',
              borderBottom: notifTab === 'activity' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {t('activity')}
            {activity.length > 0 && (
              <span style={{
                marginLeft: 6,
                background: 'var(--border-light)',
                color: 'var(--text-secondary)',
                borderRadius: 99,
                fontSize: 10,
                padding: '1px 6px',
              }}>
                {activity.length}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="notif-center-body">

          {/* ── Notifications tab ── */}
          {notifTab === 'notifications' && (
            notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 24px' }}>
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                </div>
                <div className="empty-state-title">{t('allCaughtUp')}</div>
                <div className="empty-state-text">{t('noNotificationsYet')}</div>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                  <div className={`notif-item-type-icon notif-type-${n.type?.split('_')[0]}`}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-message">{n.message}</div>
                    <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <button
                    className="notif-delete-btn"
                    onClick={() => onDeleteNotification(n._id)}
                    aria-label="Dismiss notification"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))
            )
          )}

          {/* ── Activity tab ── */}
          {notifTab === 'activity' && (
            activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 24px' }}>
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="empty-state-title">{t('noActivityYet')}</div>
                <div className="empty-state-text">{t('activityDesc')}</div>
              </div>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="notif-item">
                  {/* Type icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: a.type === 'like' ? 'rgba(249,58,91,0.15)' : 'rgba(99,102,241,0.15)',
                    color: a.type === 'like' ? '#f93a5b' : '#6366f1',
                  }} aria-hidden="true">
                    {a.type === 'like' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="notif-item-content" style={{ minWidth: 0 }}>
                    <div className="notif-item-message">
                      <Link
                        to={`/profile/${a.user._id}`}
                        style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                        onClick={() => setNotifOpen(false)}
                      >
                        {a.user.name}
                      </Link>
                      {' '}{a.type === 'like' ? t('likedYourPost') : t('commentedOnYourPost')}
                      {a.type === 'comment' && a.text && (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                          {' '}— "{a.text.length > 60 ? a.text.slice(0, 60) + '…' : a.text}"
                        </span>
                      )}
                    </div>
                    {a.postPreview && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        on: "{a.postPreview}{a.postPreview.length >= 80 ? '…' : ''}"
                      </div>
                    )}
                    <div className="notif-item-time">{timeAgo(a.when)}</div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer — "Mark all read" only on notifications tab */}
        {notifTab === 'notifications' && unreadCount > 0 && (
          <div className="notif-center-footer">
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={onMarkAllRead}>
              {t('markAllRead')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Navbar;
