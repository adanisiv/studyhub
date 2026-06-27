const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // roomId identifies the conversation between two specific users
  // index: true speeds up "get all messages for this room" queries
  roomId:  { type: String, required: true, index: true },

  // The user who sent this message (never trust the client — always use socket.userId)
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  text:    { type: String, required: true }, // the actual message content

  // readBy tracks which users have seen this message.
  // When a user opens the chat room, their ID is added to this array.
  // Used to calculate unread message counts in the conversations list.
  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true }); // createdAt used to sort messages in chronological order

module.exports = mongoose.model('Message', messageSchema);
