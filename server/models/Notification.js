const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // The user who receives this notification
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // index: true here creates a single-field index on recipient (most common query)

  // The user who triggered the notification (liked, commented, etc.)
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Type determines the icon and message template shown in the UI
  type:      {
    type: String,
    enum: ['like', 'comment', 'friend_request', 'friend_accept', 'group_join', 'group_approved'],
    required: true
  },

  message:   { type: String, required: true }, // Human-readable text e.g. "Alice liked your post"

  // Optional references — used to create clickable links in notifications
  post:      { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },   // for like/comment
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },  // for group events

  read:      { type: Boolean, default: false } // false = unread (shown as badge count in UI)
}, { timestamps: true }); // createdAt used for sorting (newest first)

module.exports = mongoose.model('Notification', notificationSchema);
