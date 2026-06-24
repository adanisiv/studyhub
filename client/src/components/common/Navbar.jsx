import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout, notifications, unreadCount, onMarkAllRead, onDeleteNotification }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Close bell on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close bell on Escape key
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setBellOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [bellOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const initial = user.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon" aria-hidden="true">S</span>
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
          {/* Notification bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              className="nav-icon-btn"
              onClick={() => setBellOpen(!bellOpen)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={bellOpen}
              aria-haspopup="true"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              {unreadCount > 0 && <span className="notification-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {bellOpen && (
              <div className="notification-dropdown" role="menu" aria-label="Notifications">
                <div className="notification-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button className="btn btn-small btn-ghost" onClick={onMarkAllRead}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                    </div>
                    <div className="empty-state-text">No notifications yet</div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className={`notification-item ${!n.read ? 'unread' : ''}`} role="menuitem">
                      <div className="notif-content">
                        <div style={{ fontSize: 'var(--text-sm)' }}>{n.message}</div>
                        <div className="notif-time">{timeAgo(n.createdAt)}</div>
                      </div>
                      <button className="notif-delete" onClick={() => onDeleteNotification(n._id)} aria-label="Delete notification">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

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
  );
}

export default Navbar;
