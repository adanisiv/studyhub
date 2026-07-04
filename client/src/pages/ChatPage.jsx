import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';

// Deterministic room ID: sort the two user IDs so A→B and B→A produce the same room
const makeRoomId = (a, b) => [a, b].sort().join('_');

// Format a timestamp as "HH:MM" (12-hour with AM/PM) for the message timestamp
const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format a date as a readable label for the date divider between messages
// Returns "Today", "Yesterday", or "Monday, Jan 1"
const formatDateLabel = (d, labels = {}) => {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return labels.today || 'Today';
  if (date.toDateString() === yesterday.toDateString()) return labels.yesterday || 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

// Format a timestamp as a short relative time for the conversation list
const timeAgo = (d, labels = {}) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return labels?.now || 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

// Group consecutive messages from the same sender into a "message group".
// This allows us to show the avatar only on the last message in a group,
// and removes repetitive sender info between back-to-back messages.
const groupMessages = (messages) => {
  const groups = [];
  let current = null;
  for (const msg of messages) {
    const senderId = msg.sender?._id || msg.sender;
    if (!senderId) continue; // skip malformed messages without a sender
    if (current && current.senderId === senderId) {
      // Same sender as previous message: add to current group
      current.messages.push(msg);
    } else {
      // New sender: start a new group
      current = { senderId, sender: msg.sender || { name: '?' }, messages: [msg] };
      groups.push(current);
    }
  }
  return groups;
};
// Shows a checkmark after messages sent by the current user:
//   ✓  = Delivered (not yet read by the other person)
//   ✓✓ = Read (other person's ID is in message.readBy array)
// Only renders for messages sent by the current user (myId).
function Receipt({ msg, myId, friendId }) {
  if ((msg.sender?._id || msg.sender) !== myId) return null;
  const isRead = msg.readBy?.some(id => (id?._id || id)?.toString() === friendId?.toString());
  return (
    <span className={`msg-receipt ${isRead ? 'read' : ''}`} title={isRead ? 'Read' : 'Delivered'}>
      {isRead ? '✓✓' : '✓'}
    </span>
  );
}
// One row in the conversation sidebar showing: avatar, online dot, name,
// last message preview, time, and unread count badge.
function ConvItem({ conv, activeId, onlineUsers, myId }) {
  const { friend, lastMsg, unreadCount } = conv;
  const isActive = activeId === friend._id;
  const isOnline = onlineUsers.has(friend._id);
  const isMe = lastMsg && (lastMsg.sender?._id || lastMsg.sender) === myId;
  const { t } = useLanguage();
  const tLabels = { now: t('nowLabel') };

  return (
    <Link
      to={`/chat/${friend._id}`}
      className={`chat-conv-item ${isActive ? 'active' : ''}`}
    >
      <div className="chat-conv-avatar-wrap">
        <div className="avatar avatar-md">{friend.name?.charAt(0)}</div>
        {isOnline && <span className="chat-conv-online-dot" title={t('online')} />}
      </div>
      <div className="chat-conv-info">
        <div className="chat-conv-row">
          <span className="chat-conv-name">{friend.name}</span>
          {lastMsg && <span className="chat-conv-time">{timeAgo(lastMsg.createdAt, tLabels)}</span>}
        </div>
        <div className="chat-conv-preview">
          {lastMsg ? (
            <>{isMe ? `${t('you')}: ` : ''}{lastMsg.text}</>
          ) : (
            <span style={{ fontStyle: 'italic' }}>{t('noMessagesHere')}</span>
          )}
        </div>
      </div>
      {/* Unread badge — hidden when 0, capped at "9+" */}
      {unreadCount > 0 && (
        <span className="chat-conv-unread">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </Link>
  );
}

function ChatPage({ user }) {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const dateLabels = { today: t('today'), yesterday: t('yesterday') };
  const [conversations, setConversations] = useState([]); // list of conversations with friends
  const [convsLoading, setConvsLoading] = useState(true);
  const [friend, setFriend] = useState(null);             // the currently selected friend's profile
  const [friendLoading, setFriendLoading] = useState(false);
  const [messages, setMessages] = useState([]);            // messages in the current room
  const [text, setText] = useState('');                   // text input value
  const [typing, setTyping] = useState(false);            // is the other person typing?
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // set of currently online user IDs
  const [searchQuery, setSearchQuery] = useState('');     // conversation search filter
  // In-conversation search panel state
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatQuery, setInChatQuery] = useState('');
  const [inChatResults, setInChatResults] = useState([]);
  const [inChatSearching, setInChatSearching] = useState(false);
  // mobileSidebar controls which panel is visible on small screens
  const [mobileSidebar, setMobileSidebar] = useState(!friendId);
  const socketRef = useRef(null);          // Socket.io instance
  const typingTimeoutRef = useRef(null);  // Timer to stop typing indicator after 1.5s pause
  const messagesEndRef = useRef(null);    // Bottom of message list (used for auto-scroll)
  const inputRef = useRef(null);          // Message input textarea (for auto-focus)
  const prevRoomRef = useRef(null);       // The room we were in before navigating

  // These refs store the current roomId and friendId so socket event handlers
  // can access them without being stale closures. This avoids re-registering
  // all socket listeners every time friendId changes.
  const roomIdRef = useRef(null);
  const friendIdRef = useRef(null);

  // Compute the room ID from both user IDs (sorted so it's deterministic)
  const roomId = friendId ? makeRoomId(user._id, friendId) : null;

  // Keep the refs in sync whenever the derived values change
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { friendIdRef.current = friendId; }, [friendId]);
  // We intentionally set up the socket ONCE and use refs inside event handlers
  // so that we don't re-create the entire socket connection on every re-render.
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Create a new socket connection with the JWT for server-side authentication
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.error('Chat socket error:', err.message);
    });

    // Presence events: maintain a Set of online user IDs
    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });
    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
    });

    // A new message arrived in one of our rooms
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]); // append to current chat
      // Update the conversation list: bump lastMsg and optionally unreadCount
      setConversations(prev => prev.map(c => {
        const r = makeRoomId(user._id, c.friend._id);
        if (r !== (msg.roomId || roomIdRef.current)) return c;
        const isActive = c.friend._id === friendIdRef.current;
        // Only increment unread count if this conversation is NOT currently open
        return { ...c, lastMsg: msg, unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1 };
      }));
    });

    // Server sends the full message history when we join a room
    socket.on('chat_history', (history) => {
      setMessages(history);
    });

    // Typing indicator events — check against the ref to avoid stale closures
    socket.on('user_typing', ({ userId: tid }) => {
      if (tid === friendIdRef.current) setTyping(true);
    });
    socket.on('user_stop_typing', ({ userId: tid }) => {
      if (tid === friendIdRef.current) setTyping(false);
    });

    // Read receipt update: the friend opened our conversation and read our messages
    socket.on('messages_read', ({ roomId: rid, readerId }) => {
      if (rid !== roomIdRef.current) return; // ignore events from other rooms
      // Update readBy on each message that hasn't been marked read yet
      setMessages(prev => prev.map(m => {
        const alreadyRead = m.readBy?.some(id => (id?._id || id)?.toString() === readerId);
        if (alreadyRead) return m;
        return { ...m, readBy: [...(m.readBy || []), readerId] };
      }));
    });

    // Explicit cleanup: unregister all listeners and disconnect when component unmounts
    return () => {
      socket.off('connect_error');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('receive_message');
      socket.off('chat_history');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('messages_read');
      socket.disconnect();
    };
  }, []); // empty deps: socket is created once and stays alive for the component's lifetime
  // Every time the user navigates to a different conversation, we:
  //   1. Stop the typing indicator in the old room
  //   2. Clear the message list (new conversation starts fresh)
  //   3. Emit join_room so the server sends chat_history
  //   4. Emit mark_read to clear unread count for this conversation
  useEffect(() => {
    if (!roomId || !socketRef.current) return;
    // Stop typing in the previous room before switching
    if (prevRoomRef.current && prevRoomRef.current !== roomId) {
      socketRef.current.emit('stop_typing', { roomId: prevRoomRef.current });
    }
    prevRoomRef.current = roomId;
    setMessages([]); // clear messages before history arrives
    setTyping(false);
    socketRef.current.emit('join_room', roomId);   // server will respond with chat_history
    socketRef.current.emit('mark_read', { roomId }); // mark all messages as read
    // Clear the unread count in the sidebar for this conversation
    setConversations(prev => prev.map(c =>
      c.friend._id === friendId ? { ...c, unreadCount: 0 } : c
    ));
    // Focus the input so the user can type immediately
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [roomId, friendId]);
  // GET /api/messages/conversations returns all friends with lastMsg and unreadCount
  useEffect(() => {
    API.get('/messages/conversations')
      .then(res => { setConversations(res.data); setConvsLoading(false); })
      .catch(() => setConvsLoading(false));
  }, []);
  useEffect(() => {
    if (!friendId) { setFriend(null); setFriendLoading(false); return; }
    setFriendLoading(true);
    API.get(`/users/${friendId}`)
      .then(res => setFriend(res.data))
      .catch(() => setFriend(null))
      .finally(() => setFriendLoading(false));
    setMobileSidebar(false); // on mobile: switch from sidebar to chat panel
  }, [friendId]);
  // Fires every time the messages array changes (new message sent or received)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim() || !socketRef.current || !roomId) return;
    // Send via socket (not REST API) for real-time delivery
    socketRef.current.emit('send_message', { roomId, text: text.trim() });
    socketRef.current.emit('stop_typing', { roomId }); // clear typing indicator
    clearTimeout(typingTimeoutRef.current);
    setText(''); // clear the input after sending
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit('typing', { roomId, userName: user.name });
    clearTimeout(typingTimeoutRef.current);
    // Reset the 1.5s timer each time the user types
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { roomId });
    }, 1500);
  };
  const isFriendOnline = friendId && onlineUsers.has(friendId);
  const grouped = groupMessages(messages); // group consecutive messages by sender

  // Filter conversations by the search input
  const filteredConvs = conversations.filter(c =>
    c.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Calls GET /api/messages/search?roomId=...&keyword=...
  // Returns matching messages from THIS chat room only (server enforces this).
  const runInChatSearch = async () => {
    if (!roomId || !inChatQuery.trim()) { setInChatResults([]); return; }
    setInChatSearching(true);
    try {
      const res = await API.get('/messages/search', {
        params: { roomId, keyword: inChatQuery.trim() }
      });
      setInChatResults(res.data);
    } catch (err) {
      console.error(err);
      setInChatResults([]);
    }
    setInChatSearching(false);
  };

  // Close the search panel + reset state when the room changes
  useEffect(() => {
    setShowInChatSearch(false);
    setInChatQuery('');
    setInChatResults([]);
  }, [roomId]);

  // Determine if a date divider should appear before a given message
  // (dividers appear at the first message of each day)
  const needsDivider = (msg, i) => {
    if (i === 0) return true; // always show divider before the first message
    const prev = messages[i - 1];
    return new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
  };

  return (
    <div className="chat-page">

      {/* ── Conversation sidebar ─────────────────────────────────────────── */}
      {/* mobileSidebar controls visibility on small screens via CSS class */}
      <div className={`chat-sidebar ${mobileSidebar ? 'mobile-show' : ''}`}>
        <div className="chat-sidebar-header">
          <span className="chat-sidebar-title">{t('messagesTitle')}</span>
          {/* Link to /search where users can find new people to chat with */}
          <Link to="/search" className="nav-icon-btn" aria-label="Find people" title="Find people to chat with">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
            </svg>
          </Link>
        </div>

        {/* Conversation search bar */}
        <div className="chat-sidebar-search">
          <label htmlFor="conv-search" className="sr-only">Search conversations</label>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
              aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              id="conv-search"
              className="form-input"
              style={{ paddingLeft: 34, borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)' }}
              placeholder={t('searchConvs')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="chat-conversations" role="list" aria-label="Conversations">
          {convsLoading ? (
            /* Skeleton rows while conversations are loading */
            [1, 2, 3, 4].map(i => (
              <div key={i} className="chat-conv-item" style={{ cursor: 'default' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%', height: 12 }} />
                  <div className="skeleton skeleton-text" style={{ width: '85%', height: 10, marginTop: 6 }} />
                </div>
              </div>
            ))
          ) : filteredConvs.length === 0 ? (
            /* Empty state: no conversations or no search results */
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div className="empty-state-title" style={{ fontSize: 'var(--text-sm)' }}>
                {searchQuery ? t('noResults') : t('noConversations')}
              </div>
              <div className="empty-state-text" style={{ fontSize: 'var(--text-xs)' }}>
                {searchQuery ? t('tryDifferentName') : t('addFriendsChat')}
              </div>
              {!searchQuery && (
                <Link to="/search" className="btn btn-primary btn-small" style={{ marginTop: 8 }}>{t('findPeople')}</Link>
              )}
            </div>
          ) : (
            /* Render each conversation item */
            filteredConvs.map(conv => (
              <ConvItem
                key={conv.friend._id}
                conv={conv}
                activeId={friendId}
                onlineUsers={onlineUsers}
                myId={user._id}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main chat panel ──────────────────────────────────────────────── */}
      <div className={`chat-main ${mobileSidebar ? 'mobile-hidden' : ''}`}>
        {!friendId ? (
          /* No conversation selected yet — show a welcome placeholder */
          <div className="chat-empty-state">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 'var(--space-4)', opacity: 0.15 }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                {t('yourMessages')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 260, margin: '0 auto' }}>
                {t('selectConversation')}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat header ─────────────────────────────────────────── */}
            <div className="chat-main-header">
              {/* Back button: on mobile, goes back to the conversation sidebar */}
              <button
                className="chat-back-btn nav-icon-btn"
                onClick={() => setMobileSidebar(true)}
                aria-label="Back to conversations"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>

              {/* Friend's avatar + name + online status — links to their profile */}
              <Link to={`/profile/${friendId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="avatar avatar-md">{friend?.name?.charAt(0) || '?'}</div>
                  {/* Green dot overlay when friend is online */}
                  {isFriendOnline && (
                    <span className="chat-conv-online-dot" style={{ width: 11, height: 11, borderWidth: 2 }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {friendLoading ? 'Loading…' : (friend?.name || 'Unknown user')}
                  </div>
                  {/* Online/Offline status text with colored dot */}
                  <div style={{ fontSize: 'var(--text-xs)', color: isFriendOnline ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isFriendOnline ? 'var(--success)' : 'var(--text-tertiary)', display: 'inline-block' }} />
                    {isFriendOnline ? t('online') : t('offline')}
                  </div>
                </div>
              </Link>

              {/* Right-side action buttons: search in chat + view profile */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  className="nav-icon-btn"
                  onClick={() => setShowInChatSearch(v => !v)}
                  aria-label="Search messages"
                  title="Search messages in this conversation"
                  aria-expanded={showInChatSearch}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </button>
                <Link to={`/profile/${friendId}`} className="nav-icon-btn" aria-label="View profile" title="View profile">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* ── In-conversation search panel ────────────────────────── */}
            {showInChatSearch && (
              <div style={{
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--bg-secondary)',
              }}>
                <form
                  onSubmit={e => { e.preventDefault(); runInChatSearch(); }}
                  style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}
                >
                  <label htmlFor="in-chat-search" className="sr-only">Search in this conversation</label>
                  <input
                    id="in-chat-search"
                    className="form-input"
                    style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                    placeholder={`Search messages with ${friend?.name || ''}…`}
                    value={inChatQuery}
                    onChange={e => setInChatQuery(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-small" type="submit" disabled={inChatSearching}>
                    {inChatSearching ? <span className="btn-spinner" /> : t('search')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => { setShowInChatSearch(false); setInChatResults([]); setInChatQuery(''); }}
                  >
                    {t('close')}
                  </button>
                </form>
                {/* Result list — collapses when empty */}
                {inChatResults.length > 0 && (
                  <div style={{
                    marginTop: 'var(--space-2)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}>
                    {inChatResults.map(m => {
                      const isMine = (m.sender?._id || m.sender) === user._id;
                      return (
                        <div key={m._id} style={{
                          padding: 'var(--space-2) var(--space-3)',
                          borderBottom: '1px solid var(--border-light)',
                          fontSize: 'var(--text-sm)',
                        }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            {isMine ? t('you') : m.sender?.name || 'Unknown'} · {new Date(m.createdAt).toLocaleString()}
                          </div>
                          <div style={{ color: 'var(--text-primary)' }}>{m.text}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!inChatSearching && inChatQuery && inChatResults.length === 0 && (
                  <div style={{
                    marginTop: 'var(--space-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}>
                    {t('noMessagesMatch')} "{inChatQuery}"
                  </div>
                )}
              </div>
            )}

            {/* ── Message list ─────────────────────────────────────────── */}
            {/* role="log" + aria-live="polite" makes screen readers announce new messages */}
            <div className="chat-messages-area" role="log" aria-live="polite" aria-label="Messages">
              {messages.length === 0 && (
                /* Empty state for a new conversation */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-10)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 'var(--space-3)' }}>👋</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{t('sayHelloTo')} {friend?.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>{t('startConversation')}</div>
                </div>
              )}

              {/* Render grouped messages with date dividers between days.
                  We use an IIFE (immediately invoked function) here because we need
                  to track a global message index across groups for the needsDivider check. */}
              {(() => {
                let msgIndex = 0;
                return grouped.map((group, gi) => {
                  const isMine = group.senderId === user._id; // did I send these messages?
                  return (
                    <React.Fragment key={gi}>
                      {group.messages.map((msg, mi) => {
                        const globalIdx = msgIndex++; // increment global index for date logic
                        const showDivider = needsDivider(msg, globalIdx);
                        const isLast = mi === group.messages.length - 1;
                        return (
                          <React.Fragment key={msg._id || `${gi}-${mi}`}>
                            {/* Date divider: shown on the first message of each new day */}
                            {showDivider && msg.createdAt && (
                              <div className="chat-date-divider" aria-label={formatDateLabel(msg.createdAt, dateLabels)}>
                                {formatDateLabel(msg.createdAt, dateLabels)}
                              </div>
                            )}
                            <div className={`msg-group ${isMine ? 'mine' : 'theirs'}`} style={{ marginTop: mi === 0 && gi > 0 ? 'var(--space-3)' : 0 }}>
                              <div className="msg-group-row">
                                {/* Avatar: shown only on the LAST message in a group (bottom-aligned) */}
                                {!isMine && mi === group.messages.length - 1 && (
                                  <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                                    {group.sender?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                                {/* Spacer: keeps message aligned when avatar is not shown */}
                                {!isMine && mi < group.messages.length - 1 && (
                                  <div style={{ width: 28, flexShrink: 0 }} />
                                )}
                                <div>
                                  <div className="msg-bubble">{msg.text}</div>
                                  {/* Timestamp + read receipt: only on the last message in the group */}
                                  {isLast && (
                                    <div className="msg-bubble-meta">
                                      <span className="msg-time-label">{formatTime(msg.createdAt)}</span>
                                      {isMine && <Receipt msg={msg} myId={user._id} friendId={friendId} />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })()}
              {/* Invisible element at the bottom — scrolled into view when new messages arrive */}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Typing indicator bar ─────────────────────────────────── */}
            {/* aria-live="polite" announces typing status to screen readers */}
            <div className="chat-typing-bar" aria-live="polite">
              {typing && (
                <>
                  {/* Three animated dots (CSS animation) */}
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                  <span>{friend?.name} {t('isTyping')}</span>
                </>
              )}
            </div>

            {/* ── Message input form ───────────────────────────────────── */}
            <form className="chat-input-bar" onSubmit={handleSend}>
              <label htmlFor="chat-msg-input" className="sr-only">Message {friend?.name}</label>
              <textarea
                id="chat-msg-input"
                ref={inputRef}
                className="chat-input-field"
                placeholder={`${t('typeMessage').replace('…', '')} ${friend?.name || ''}...`}
                value={text}
                onChange={handleTyping}     // updates text AND emits typing events
                onKeyDown={handleKeyDown}   // Enter = send, Shift+Enter = newline
                rows={1}
                aria-label={`Message ${friend?.name || ''}`}
              />
              {/* Send button — disabled when the input is empty */}
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!text.trim()}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
