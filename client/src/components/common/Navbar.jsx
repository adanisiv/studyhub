import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TYPE_ICON = {
  like: '❤️',
  comment: '💬',
  friend_request: '🤝',
  group_join: '👥',
  group_approved: '✅',
};

function Navbar({ user, onLogout, notifications, unreadCount, onMarkAllRead, onDeleteNotification }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Close panel on Escape
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setNotifOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [notifOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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
              Feed
            </Link>
            <Link to="/groups" className={isActive('/groups')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              Groups
            </Link>
            <Link to="/search" className={isActive('/search')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Search
            </Link>
            <Link to="/stats" className={isActive('/stats')} role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              Stats
            </Link>
            <Link to={`/profile/${user._id}`} className="nav-user-btn" aria-label={`Profile for ${user.name}`}>
              <span className="nav-user-avatar" aria-hidden="true">{initial}</span>
              {user.name?.split(' ')[0]}
            </Link>
          </div>

          <div className="nav-actions">
            {/* Notification bell — opens slide-in panel */}
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

            {/* Dark mode toggle */}
            <button className="nav-icon-btn" onClick={toggleDark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
            </button>

            <button className="btn btn-small btn-ghost" onClick={onLogout} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--text-xs)' }} aria-label="Log out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Notification Center — slide-in panel */}
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
        <div className="notif-center-header">
          <span className="notif-center-title">
            Notifications
            {unreadCount > 0 && (
              <span className="notification-badge" style={{ marginLeft: 8, position: 'static', display: 'inline-flex' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <button className="nav-icon-btn" onClick={() => setNotifOpen(false)} aria-label="Close notifications" style={{ color: 'var(--text-tertiary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="notif-center-body">
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <div className="empty-state-title">All caught up!</div>
              <div className="empty-state-text">No notifications yet. Interact with posts and groups to get notified.</div>
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
          )}
        </div>

        {unreadCount > 0 && (
          <div className="notif-center-footer">
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => { onMarkAllRead(); }}>
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Navbar;
