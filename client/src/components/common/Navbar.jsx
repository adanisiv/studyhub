import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">StudyHub</Link>
      <div className="nav-links">
        <Link to="/" className={isActive('/')}>Feed</Link>
        <Link to="/groups" className={isActive('/groups')}>Groups</Link>
        <Link to="/search" className={isActive('/search')}>Search</Link>
        <Link to="/stats" className={isActive('/stats')}>Stats</Link>
        <Link to={`/profile/${user._id}`} className={isActive(`/profile/${user._id}`)}>
          {user.name}
        </Link>
        <button className="btn btn-small btn-outline" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
