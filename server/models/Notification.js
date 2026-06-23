const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['like', 'comment', 'friend_request', 'group_join', 'group_approved'], required: true },
  message:   { type: String, required: true },
  post:      { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  read:      { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
