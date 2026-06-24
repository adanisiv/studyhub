import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';

function ChatPage({ user }) {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [friendOnline, setFriendOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const roomId = [user._id, friendId].sort().join('_');

  useEffect(() => {
    API.get(`/users/${friendId}`).then(res => setFriend(res.data)).catch(console.error);

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.emit('join_room', roomId);

    socket.on('chat_history', (history) => setMessages(history));
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('user_typing', () => setTyping(true));
    socket.on('user_stop_typing', () => setTyping(false));
    socket.on('user_online', ({ userId }) => {
      if (userId === friendId) setFriendOnline(true);
    });
    socket.on('user_offline', ({ userId }) => {
      if (userId === friendId) setFriendOnline(false);
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('user_online');
      socket.off('user_offline');
      socket.disconnect();
    };
  }, [roomId, friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { roomId, senderId: user._id, text: text.trim() });
    socketRef.current.emit('stop_typing', { roomId });
    setText('');
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { roomId, userName: user.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { roomId });
    }, 1500);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDivider = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateDivider = (msg, i) => {
    if (i === 0) return true;
    const prev = new Date(messages[i - 1].createdAt).toDateString();
    const curr = new Date(msg.createdAt).toDateString();
    return prev !== curr;
  };

  const friendInitial = friend?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div>
      <div className="chat-container">
        {/* Chat header */}
        <div className="chat-header">
          <Link to={friend ? `/profile/${friend._id}` : '#'} style={{ textDecoration: 'none' }} aria-label={`View ${friend?.name || 'user'}'s profile`}>
            <div className="avatar avatar-blue">{friendInitial}</div>
          </Link>
          <div>
            <div className="chat-header-name">{friend?.name || 'Loading...'}</div>
            <div className="chat-header-status">
              <span className={`status-dot ${friendOnline ? '' : 'offline'}`} />
              {friendOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-label="Chat messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.2 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <div className="empty-state-text">No messages yet. Say hello!</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = (msg.sender?._id || msg.sender) === user._id;
            return (
              <React.Fragment key={i}>
                {msg.createdAt && shouldShowDateDivider(msg, i) && (
                  <div className="chat-date-divider">{formatDateDivider(msg.createdAt)}</div>
                )}
                <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && <div className="sender">{msg.sender?.name || 'User'}</div>}
                  {msg.text}
                  {msg.createdAt && <span className="msg-time">{formatTime(msg.createdAt)}</span>}
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typing && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span /><span /><span />
            </span>
            {friend?.name} is typing
          </div>
        )}

        {/* Input */}
        <form className="chat-input-area" onSubmit={handleSend}>
          <label htmlFor="chat-input" className="sr-only">Type a message</label>
          <input id="chat-input" className="form-input" placeholder="Type a message..."
            value={text} onChange={handleTyping} autoFocus />
          <button className="btn btn-primary" type="submit" aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
