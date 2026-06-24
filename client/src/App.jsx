import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './components/common/ConfirmDialog';
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
import API from './api/axios';

let socket = null;

function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Socket.io connection for notifications
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    socket = io('http://localhost:5000', { auth: { token } });

    socket.on('new_notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => { socket.disconnect(); socket = null; };
  }, [user]);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    API.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    API.get('/notifications/unread').then(res => setUnreadCount(res.data.count)).catch(() => {});
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const n = prev.find(x => x._id === id);
        if (n && !n.read) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(x => x._id !== id);
      });
    } catch (err) { console.error(err); }
  };

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    if (socket) { socket.disconnect(); socket = null; }
  };

  const Protected = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <div className="app">
            {user && (
              <Navbar
                user={user}
                onLogout={logout}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={handleMarkAllRead}
                onDeleteNotification={handleDeleteNotification}
              />
            )}
            <Routes>
              {/* Auth pages — full-page layout, no .main wrapper */}
              <Route path="/login" element={
                user ? <Navigate to="/" /> : <LoginPage onLogin={login} />
              } />
              <Route path="/register" element={
                user ? <Navigate to="/" /> : <RegisterPage onLogin={login} />
              } />

              {/* App pages — wrapped in .main */}
              <Route path="/" element={
                <Protected><div className="main"><FeedPage user={user} /></div></Protected>
              } />
              <Route path="/groups" element={
                <Protected><div className="main"><GroupsPage user={user} /></div></Protected>
              } />
              <Route path="/groups/:id" element={
                <Protected><div className="main"><GroupDetailPage user={user} /></div></Protected>
              } />
              <Route path="/search" element={
                <Protected><div className="main"><SearchPage user={user} /></div></Protected>
              } />
              <Route path="/profile/:id" element={
                <Protected><div className="main"><ProfilePage currentUser={user} /></div></Protected>
              } />
              <Route path="/chat/:friendId" element={
                <Protected><div className="main"><ChatPage user={user} /></div></Protected>
              } />
              <Route path="/stats" element={
                <Protected><div className="main"><StatsPage /></div></Protected>
              } />
            </Routes>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export { socket };
export default App;
