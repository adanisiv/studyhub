import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';

// create socket connection once
const socket = io('http://localhost:5000');

function ChatPage({ user }) {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // room id = sorted pair of user ids (same room for both sides)
  const roomId = [user._id, friendId].sort().join('_');

  useEffect(() => {
    // load friend info
    API.get(`/users/${friendId}`).then(res => setFriend(res.data)).catch(console.error);

    // join room
    socket.emit('join_room', roomId);

    // listen for chat history (sent on join)
    socket.on('chat_history', (history) => {
      setMessages(history);
    });

    // listen for new messages
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // typing indicators
    socket.on('user_typing', ({ userName }) => {
      setTyping(`${userName} is typing...`);
    });
    socket.on('user_stop_typing', () => {
      setTyping('');
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [roomId, friendId]);

  // auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit('send_message', {
      roomId,
      senderId: user._id,
      text: text.trim()
    });
    socket.emit('stop_typing', { roomId });
    setText('');
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    // emit typing event
    socket.emit('typing', { roomId, userName: user.name });

    // clear previous timeout and set a new one
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId });
    }, 1500);
  };

  return (
    <div>
      <h1 className="page-title">
        Chat with {friend?.name || 'Loading...'}
      </h1>

      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="text-muted text-center mt-20">No messages yet. Say hello!</p>
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
          <button className="btn btn-primary" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
