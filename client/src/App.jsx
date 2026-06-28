import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './components/common/ConfirmDialog';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/common/Navbar';
import { LanguageProvider } from './contexts/LanguageContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import StatsPage from './pages/StatsPage';
import TagPage from './pages/TagPage';
import API from './api/axios';

// Module-level socket variable — shared across the app but not in React state.
// Putting it in state would cause unnecessary re-renders on socket events.
let socket = null;

function App() {
  const [user, setUser] = useState(null);              // null = not logged in
  const [notifications, setNotifications] = useState([]); // list of notification objects
  const [unreadCount, setUnreadCount] = useState(0);   // badge count for the bell icon
  const [activity, setActivity] = useState([]);         // recent likes/comments on the user's posts
  // Detects the browser language and sets the HTML dir attribute for RTL languages.
  // This makes Hebrew, Arabic, etc. render correctly right-to-left.
  useEffect(() => {
    try {
      const userLang = navigator?.language || 'en';
      const rtlLangs = ['he', 'ar', 'fa', 'ur'];
      const isRTL = rtlLangs.some(lang => userLang.startsWith(lang));
      if (document?.documentElement) {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = userLang;
      }
    } catch (e) {
      console.error('RTL detection error:', e);
    }
  }, []); // empty deps: runs once on mount
  // When the page loads, check if the user was previously logged in.
  // The user object is saved to localStorage by the login() function below.
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);
  // Create a socket connection when the user logs in, disconnect when they log out.
  // The JWT is sent in the handshake auth so the server can verify who's connecting.
  useEffect(() => {
    if (!user) return; // don't connect if not logged in
    const token = localStorage.getItem('token');
    socket = io('http://localhost:5000', { auth: { token } });

    // Listen for real-time notifications pushed from the server
    socket.on('new_notification', (notif) => {
      setNotifications(prev => [notif, ...prev]); // add to the top of the list
      setUnreadCount(prev => prev + 1);            // increment the badge
    });

    // Cleanup: disconnect when user logs out or component unmounts
    return () => { socket.disconnect(); socket = null; };
  }, [user]); // re-run when user changes (login/logout)
  // Fetches existing notifications + unread count + activity stream when the user logs in.
  // Real-time notifications (above) only deliver NEW ones while online.
  useEffect(() => {
    if (!user) return;
    API.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    API.get('/notifications/unread').then(res => setUnreadCount(res.data.count)).catch(() => {});
    API.get(`/stats/user/${user._id}/activity`).then(res => setActivity(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, [user]);

  // Mark all notifications as read (called by Navbar when the panel is opened)
  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true }))); // update UI immediately
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  // Delete a single notification by ID
  const handleDeleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => {
        // If the deleted notification was unread, decrement the badge count
        const n = prev.find(x => x._id === id);
        if (n && !n.read) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(x => x._id !== id);
      });
    } catch (err) { console.error(err); }
  };

  // login — called by LoginPage and RegisterPage after a successful API call
  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData)); // persist for page refresh
    localStorage.setItem('token', token);
    setUser(userData);
  };

  // updateUser — called by ProfilePage after the user saves their own profile
  // (e.g. new name or avatar) so the Navbar reflects the change immediately
  const updateUser = (patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  // logout — clears all auth state and disconnects socket
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    setActivity([]);
    if (socket) { socket.disconnect(); socket = null; }
  };
  // Redirects unauthenticated users to /login.
  // Defined inside App so it has access to the 'user' state.
  const Protected = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return children;
  };
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LanguageProvider>
      {/* ErrorBoundary catches any unhandled JS errors in child components */}
      <ErrorBoundary>
        {/* ToastProvider makes toast notifications available app-wide via useToast() */}
        <ToastProvider>
          {/* ConfirmProvider makes the confirmation dialog available via useConfirm() */}
          <ConfirmProvider>
            <div className="app">
              {/* Navbar is only rendered when the user is logged in */}
              {user && (
                <Navbar
                  user={user}
                  onLogout={logout}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onDeleteNotification={handleDeleteNotification}
                  activity={activity}
                />
              )}

              <Routes>
                {/* ── Auth pages: full-page layout, no .main wrapper ── */}
                {/* Redirect to feed if already logged in */}
                <Route path="/login" element={
                  user ? <Navigate to="/" /> : <LoginPage onLogin={login} />
                } />
                <Route path="/register" element={
                  user ? <Navigate to="/" /> : <RegisterPage onLogin={login} />
                } />

                {/* ── App pages: wrapped in .main for layout ── */}
                {/* All app routes are Protected — redirects to /login if not authenticated */}
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
                  <Protected><div className="main"><ProfilePage currentUser={user} onUserUpdate={updateUser} /></div></Protected>
                } />
                {/* Chat has its own full-page layout (no .main wrapper) */}
                <Route path="/chat" element={
                  <Protected><ChatPage user={user} /></Protected>
                } />
                <Route path="/chat/:friendId" element={
                  <Protected><ChatPage user={user} /></Protected>
                } />
                <Route path="/stats" element={
                  <Protected><div className="main"><StatsPage /></div></Protected>
                } />
                {/* Dedicated hashtag page — landing page for every clickable tag */}
                <Route path="/tag/:tag" element={
                  <Protected><div className="main"><TagPage user={user} /></div></Protected>
                } />
              </Routes>
            </div>
          </ConfirmProvider>
        </ToastProvider>
      </ErrorBoundary>
      </LanguageProvider>
    </BrowserRouter>
    </QueryClientProvider>
  );
}

// Export socket so other modules can use it for additional real-time features
export { socket };
export default App;
