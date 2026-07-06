const Message = require('../models/Message');

module.exports = (io) => {
  // Track which Socket.io room each socket is currently in.
  // Map: socket.id → roomId
  // Used to leave the previous room when the user opens a different conversation.
  const socketRoom = new Map();

  io.on('connection', (socket) => {
    const userId = socket.userId; // set by the auth middleware in server.js
    // (The per-user notification room `user_<id>` is already joined in server.js,
    //  which is where controllers emit to via io.to(`user_${recipientId}`).)

    // Notify everyone that this user just came online
    socket.broadcast.emit('user_online', { userId });
    // Fired when the user opens a chat conversation.
    // Sends the message history and marks any unread messages as read.
    socket.on('join_room', async (roomId) => {
      // Leave the previous room if the user switches conversations
      const prevRoom = socketRoom.get(socket.id);
      if (prevRoom && prevRoom !== roomId) socket.leave(prevRoom);

      socket.join(roomId);
      socketRoom.set(socket.id, roomId); // track current room

      // Load and send the last 200 messages in chronological order
      const history = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(200)
        .populate('sender', 'name avatar');
      socket.emit('chat_history', history);

      // Auto-mark unread messages as read when the user joins the room
      if (userId) {
        await Message.updateMany(
          // Find messages sent by the OTHER user that this user hasn't read
          { roomId, sender: { $ne: userId }, readBy: { $not: { $elemMatch: { $eq: userId } } } },
          { $push: { readBy: userId } } // add this user to the readBy array
        );
        // Tell the other participant their messages were read (for read receipts)
        socket.to(roomId).emit('messages_read', { roomId, readerId: userId });
      }
    });
    // Fired when the user sends a message in an active chat.
    // SECURITY: always use socket.userId (verified JWT) — never trust client-supplied senderId.
    socket.on('send_message', async ({ roomId, text }) => {
      if (!userId || !roomId || !text?.trim()) return; // reject empty messages

      // Verify the sending user is actually a participant in this room
      // (room format: "userId1_userId2")
      const parts = roomId.split('_');
      if (parts.length !== 2 || !parts.includes(userId)) {
        return socket.emit('error_message', { error: 'Unauthorized room' });
      }

      try {
        // Save the message to the database
        const message = await Message.create({
          roomId,
          sender: userId,
          text: text.trim(),
          readBy: [userId] // the sender has already "read" their own message
        });

        // Populate sender info for display in the chat UI
        const populated = await message.populate('sender', 'name avatar');

        // Broadcast to ALL sockets in this room (including the sender)
        io.to(roomId).emit('receive_message', populated);
      } catch (err) {
        socket.emit('error_message', { error: err.message });
      }
    });
    // Fired when the user reads messages in an already-open chat.
    // Updates the readBy array and notifies the other participant.
    socket.on('mark_read', async ({ roomId }) => {
      if (!userId || !roomId) return;
      await Message.updateMany(
        { roomId, sender: { $ne: userId }, readBy: { $not: { $elemMatch: { $eq: userId } } } },
        { $push: { readBy: userId } }
      );
      // Notify the other person their messages have been read
      socket.to(roomId).emit('messages_read', { roomId, readerId: userId });
    });
    // Broadcast typing indicators to the other participant.
    // These are UI-only events — nothing is saved to the database.
    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('user_typing', { userId, userName });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing', { userId });
    });
    // Cleanup when a user closes the tab or loses connection.
    socket.on('disconnect', () => {
      socketRoom.delete(socket.id);                  // remove room tracking entry
      socket.broadcast.emit('user_offline', { userId }); // notify others this user went offline
    });
  });
};
