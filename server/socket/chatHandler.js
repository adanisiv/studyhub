const Message = require('../models/Message');

module.exports = (io) => {
  // Track which room each socket is in (for read receipts)
  const socketRoom = new Map();

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Broadcast online status to everyone
    socket.broadcast.emit('user_online', { userId });

    socket.on('join_room', async (roomId) => {
      // Leave previous room if any
      const prevRoom = socketRoom.get(socket.id);
      if (prevRoom && prevRoom !== roomId) socket.leave(prevRoom);

      socket.join(roomId);
      socketRoom.set(socket.id, roomId);

      // Load history
      const history = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(200)
        .populate('sender', 'name avatar');
      socket.emit('chat_history', history);

      // Auto mark messages as read when joining
      if (userId) {
        await Message.updateMany(
          { roomId, sender: { $ne: userId }, readBy: { $not: { $elemMatch: { $eq: userId } } } },
          { $push: { readBy: userId } }
        );
        // Notify the other party their messages were read
        socket.to(roomId).emit('messages_read', { roomId, readerId: userId });
      }
    });

    socket.on('send_message', async ({ roomId, senderId, text }) => {
      try {
        const message = await Message.create({ roomId, sender: senderId, text, readBy: [senderId] });
        const populated = await message.populate('sender', 'name avatar');
        io.to(roomId).emit('receive_message', populated);
      } catch (err) {
        socket.emit('error_message', { error: err.message });
      }
    });

    socket.on('mark_read', async ({ roomId }) => {
      if (!userId || !roomId) return;
      await Message.updateMany(
        { roomId, sender: { $ne: userId }, readBy: { $not: { $elemMatch: { $eq: userId } } } },
        { $push: { readBy: userId } }
      );
      socket.to(roomId).emit('messages_read', { roomId, readerId: userId });
    });

    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('user_typing', { userId, userName });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing', { userId });
    });

    socket.on('disconnect', () => {
      socketRoom.delete(socket.id);
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};
