const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // join a chat room (roomId = sorted pair of user ids)
    socket.on('join_room', async (roomId) => {
      socket.join(roomId);

      // send chat history
      const history = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(100)
        .populate('sender', 'name avatar');
      socket.emit('chat_history', history);
    });

    // send message
    socket.on('send_message', async ({ roomId, senderId, text }) => {
      try {
        const message = await Message.create({ roomId, sender: senderId, text });
        const populated = await message.populate('sender', 'name avatar');
        io.to(roomId).emit('receive_message', populated);
      } catch (err) {
        socket.emit('error_message', { error: err.message });
      }
    });

    // typing indicator
    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
