import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import StatsPage from './pages/StatsPage';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // protect routes — redirect to login if not logged in
  const Protected = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <BrowserRouter>
      <div className="app">
        {user && <Navbar user={user} onLogout={logout} />}
        <div className="main">
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <LoginPage onLogin={login} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" /> : <RegisterPage onLogin={login} />
            } />
            <Route path="/" element={
              <Protected><FeedPage user={user} /></Protected>
            } />
            <Route path="/groups" element={
              <Protected><GroupsPage user={user} /></Protected>
            } />
            <Route path="/groups/:id" element={
              <Protected><GroupDetailPage user={user} /></Protected>
            } />
            <Route path="/search" element={
              <Protected><SearchPage user={user} /></Protected>
            } />
            <Route path="/profile/:id" element={
              <Protected><ProfilePage currentUser={user} /></Protected>
            } />
            <Route path="/chat/:friendId" element={
              <Protected><ChatPage user={user} /></Protected>
            } />
            <Route path="/stats" element={
              <Protected><StatsPage /></Protected>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
