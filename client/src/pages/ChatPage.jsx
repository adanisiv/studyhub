import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';

function ChatPage({ user }) {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const roomId = [user._id, friendId].sort().join('_');

  useEffect(() => {
    API.get(`/users/${friendId}`).then(res => setFriend(res.data)).catch(console.error);

    // Socket.io with JWT authentication
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.emit('join_room', roomId);

    socket.on('chat_history', (history) => setMessages(history));
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('user_typing', ({ userName }) => setTyping(`${userName} is typing...`));
    socket.on('user_stop_typing', () => setTyping(''));

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
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

  const friendInitial = friend?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div>
      <div className="chat-container">
        {/* Chat header */}
        <div className="chat-header">
          <Link to={friend ? `/profile/${friend._id}` : '#'} style={{ textDecoration: 'none' }}>
            <div className="avatar avatar-blue">{friendInitial}</div>
          </Link>
          <div>
            <div className="chat-header-name">{friend?.name || 'Loading...'}</div>
            <div className="chat-header-status">
              <span className="status-dot" />
              Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.2 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <div className="empty-state-text">No messages yet. Say hello!</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = (msg.sender?._id || msg.sender) === user._id;
            return (
              <div key={i} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine && <div className="sender">{msg.sender?.name || 'User'}</div>}
                {msg.text}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div className="typing-indicator">{typing}</div>

        {/* Input */}
        <form className="chat-input-area" onSubmit={handleSend}>
          <input className="form-input" placeholder="Type a message..."
            value={text} onChange={handleTyping} autoFocus />
          <button className="btn btn-primary" type="submit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
