import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeRoomId = (a, b) => [a, b].sort().join('_');

const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const timeAgo = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

// Group consecutive messages from the same sender
const groupMessages = (messages) => {
  const groups = [];
  let current = null;
  for (const msg of messages) {
    const senderId = msg.sender?._id || msg.sender;
    if (!senderId) continue; // skip malformed messages
    if (current && current.senderId === senderId) {
      current.messages.push(msg);
    } else {
      current = { senderId, sender: msg.sender || { name: '?' }, messages: [msg] };
      groups.push(current);
    }
  }
  return groups;
};

// ── Read receipt checkmark ────────────────────────────────────────────────────

function Receipt({ msg, myId, friendId }) {
  if ((msg.sender?._id || msg.sender) !== myId) return null;
  const isRead = msg.readBy?.some(id => (id?._id || id)?.toString() === friendId?.toString());
  return (
    <span className={`msg-receipt ${isRead ? 'read' : ''}`} title={isRead ? 'Read' : 'Delivered'}>
      {isRead ? '✓✓' : '✓'}
    </span>
  );
}

// ── Conversation list item ────────────────────────────────────────────────────

function ConvItem({ conv, activeId, onlineUsers, myId }) {
  const { friend, lastMsg, unreadCount } = conv;
  const isActive = activeId === friend._id;
  const isOnline = onlineUsers.has(friend._id);
  const isMe = lastMsg && (lastMsg.sender?._id || lastMsg.sender) === myId;

  return (
    <Link
      to={`/chat/${friend._id}`}
      className={`chat-conv-item ${isActive ? 'active' : ''}`}
    >
      <div className="chat-conv-avatar-wrap">
        <div className="avatar avatar-md">{friend.name?.charAt(0)}</div>
        {isOnline && <span className="chat-conv-online-dot" title="Online" />}
      </div>
      <div className="chat-conv-info">
        <div className="chat-conv-row">
          <span className="chat-conv-name">{friend.name}</span>
          {lastMsg && <span className="chat-conv-time">{timeAgo(lastMsg.createdAt)}</span>}
        </div>
        <div className="chat-conv-preview">
          {lastMsg ? (
            <>{isMe ? 'You: ' : ''}{lastMsg.text}</>
          ) : (
            <span style={{ fontStyle: 'italic' }}>No messages yet</span>
          )}
        </div>
      </div>
      {unreadCount > 0 && (
        <span className="chat-conv-unread">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </Link>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────

function ChatPage({ user }) {
  const { friendId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [friend, setFriend] = useState(null);
  const [friendLoading, setFriendLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebar, setMobileSidebar] = useState(!friendId);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevRoomRef = useRef(null);
  // Refs so socket handlers always see current values without re-registering
  const roomIdRef = useRef(null);
  const friendIdRef = useRef(null);

  const roomId = friendId ? makeRoomId(user._id, friendId) : null;

  // Keep refs in sync with state/params
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { friendIdRef.current = friendId; }, [friendId]);

  // ── Socket setup (once) ───────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.error('Chat socket error:', err.message);
    });
    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });
    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
    });
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      // Update conversation list using refs to avoid stale closure
      setConversations(prev => prev.map(c => {
        const r = makeRoomId(user._id, c.friend._id);
        if (r !== (msg.roomId || roomIdRef.current)) return c;
        const isActive = c.friend._id === friendIdRef.current;
        return { ...c, lastMsg: msg, unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1 };
      }));
    });
    socket.on('chat_history', (history) => {
      setMessages(history);
    });
    socket.on('user_typing', ({ userId: tid }) => {
      if (tid === friendIdRef.current) setTyping(true);
    });
    socket.on('user_stop_typing', ({ userId: tid }) => {
      if (tid === friendIdRef.current) setTyping(false);
    });
    socket.on('messages_read', ({ roomId: rid, readerId }) => {
      if (rid !== roomIdRef.current) return;
      setMessages(prev => prev.map(m => {
        const alreadyRead = m.readBy?.some(id => (id?._id || id)?.toString() === readerId);
        if (alreadyRead) return m;
        return { ...m, readBy: [...(m.readBy || []), readerId] };
      }));
    });

    return () => {
      // Explicit teardown — avoids ghost listeners if component remounts
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
  }, []);  // intentionally once — refs handle dynamic values

  // ── Join/leave room when friendId changes ─────────────────────────────────

  useEffect(() => {
    if (!roomId || !socketRef.current) return;
    if (prevRoomRef.current && prevRoomRef.current !== roomId) {
      socketRef.current.emit('stop_typing', { roomId: prevRoomRef.current });
    }
    prevRoomRef.current = roomId;
    setMessages([]);
    setTyping(false);
    socketRef.current.emit('join_room', roomId);
    socketRef.current.emit('mark_read', { roomId });
    // Clear unread count for this conversation
    setConversations(prev => prev.map(c =>
      c.friend._id === friendId ? { ...c, unreadCount: 0 } : c
    ));
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [roomId, friendId]);

  // ── Load conversations ────────────────────────────────────────────────────

  useEffect(() => {
    API.get('/messages/conversations')
      .then(res => { setConversations(res.data); setConvsLoading(false); })
      .catch(() => setConvsLoading(false));
  }, []);

  // ── Load friend details ───────────────────────────────────────────────────

  useEffect(() => {
    if (!friendId) { setFriend(null); setFriendLoading(false); return; }
    setFriendLoading(true);
    API.get(`/users/${friendId}`)
      .then(res => setFriend(res.data))
      .catch(() => setFriend(null))
      .finally(() => setFriendLoading(false));
    setMobileSidebar(false);
  }, [friendId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim() || !socketRef.current || !roomId) return;
    socketRef.current.emit('send_message', { roomId, text: text.trim() });
    socketRef.current.emit('stop_typing', { roomId });
    clearTimeout(typingTimeoutRef.current);
    setText('');
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
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { roomId });
    }, 1500);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const isFriendOnline = friendId && onlineUsers.has(friendId);
  const grouped = groupMessages(messages);
  const filteredConvs = conversations.filter(c =>
    c.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Date divider logic
  const needsDivider = (msg, i) => {
    if (i === 0) return true;
    const prev = messages[i - 1];
    return new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="chat-page">

      {/* ── Sidebar ── */}
      <div className={`chat-sidebar ${mobileSidebar ? 'mobile-show' : ''}`}>
        <div className="chat-sidebar-header">
          <span className="chat-sidebar-title">Messages</span>
          <Link to="/search" className="nav-icon-btn" aria-label="Find people" title="Find people to chat with">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
            </svg>
          </Link>
        </div>

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
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-conversations" role="list" aria-label="Conversations">
          {convsLoading ? (
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
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div className="empty-state-title" style={{ fontSize: 'var(--text-sm)' }}>
                {searchQuery ? 'No results' : 'No conversations'}
              </div>
              <div className="empty-state-text" style={{ fontSize: 'var(--text-xs)' }}>
                {searchQuery ? 'Try a different name' : 'Add friends to start chatting'}
              </div>
              {!searchQuery && (
                <Link to="/search" className="btn btn-primary btn-small" style={{ marginTop: 8 }}>Find People</Link>
              )}
            </div>
          ) : (
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

      {/* ── Main chat area ── */}
      <div className={`chat-main ${mobileSidebar ? 'mobile-hidden' : ''}`}>
        {!friendId ? (
          /* No conversation selected */
          <div className="chat-empty-state">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 'var(--space-4)', opacity: 0.15 }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                Your Messages
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 260, margin: '0 auto' }}>
                Select a conversation from the sidebar to start chatting
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-main-header">
              <button
                className="chat-back-btn nav-icon-btn"
                onClick={() => setMobileSidebar(true)}
                aria-label="Back to conversations"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>

              <Link to={`/profile/${friendId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="avatar avatar-md">{friend?.name?.charAt(0) || '?'}</div>
                  {isFriendOnline && (
                    <span className="chat-conv-online-dot" style={{ width: 11, height: 11, borderWidth: 2 }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {friendLoading ? 'Loading…' : (friend?.name || 'Unknown user')}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: isFriendOnline ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isFriendOnline ? 'var(--success)' : 'var(--text-tertiary)', display: 'inline-block' }} />
                    {isFriendOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </Link>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                <Link to={`/profile/${friendId}`} className="nav-icon-btn" aria-label="View profile" title="View profile">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages-area" role="log" aria-live="polite" aria-label="Messages">
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-10)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 'var(--space-3)' }}>👋</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Say hello to {friend?.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>Start the conversation!</div>
                </div>
              )}

              {/* Render grouped messages with date dividers */}
              {(() => {
                let msgIndex = 0;
                return grouped.map((group, gi) => {
                  const isMine = group.senderId === user._id;
                  return (
                    <React.Fragment key={gi}>
                      {group.messages.map((msg, mi) => {
                        const globalIdx = msgIndex++;
                        const showDivider = needsDivider(msg, globalIdx);
                        const isLast = mi === group.messages.length - 1;
                        const isLastOverall = gi === grouped.length - 1 && isLast;
                        return (
                          <React.Fragment key={msg._id || `${gi}-${mi}`}>
                            {showDivider && msg.createdAt && (
                              <div className="chat-date-divider" aria-label={formatDateLabel(msg.createdAt)}>
                                {formatDateLabel(msg.createdAt)}
                              </div>
                            )}
                            <div className={`msg-group ${isMine ? 'mine' : 'theirs'}`} style={{ marginTop: mi === 0 && gi > 0 ? 'var(--space-3)' : 0 }}>
                              <div className="msg-group-row">
                                {!isMine && mi === group.messages.length - 1 && (
                                  <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                                    {group.sender?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                                {!isMine && mi < group.messages.length - 1 && (
                                  <div style={{ width: 28, flexShrink: 0 }} />
                                )}
                                <div>
                                  <div className="msg-bubble">{msg.text}</div>
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
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            <div className="chat-typing-bar" aria-live="polite">
              {typing && (
                <>
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                  <span>{friend?.name} is typing</span>
                </>
              )}
            </div>

            {/* Input */}
            <form className="chat-input-bar" onSubmit={handleSend}>
              <label htmlFor="chat-msg-input" className="sr-only">Message {friend?.name}</label>
              <textarea
                id="chat-msg-input"
                ref={inputRef}
                className="chat-input-field"
                placeholder={`Message ${friend?.name || ''}...`}
                value={text}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label={`Message ${friend?.name || ''}`}
              />
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
