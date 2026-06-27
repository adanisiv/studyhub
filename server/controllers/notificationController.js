const Notification = require('../models/Notification');

// Returns the 30 most recent notifications, newest first.
// Populates the sender so the UI can show "Alice liked your post" with Alice's name.
exports.list = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })         // newest first
      .limit(30)                        // cap at 30 to avoid large payloads
      .populate('sender', 'name avatar'); // replace ObjectId with sender's name/avatar
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns just the count of unread notifications.
// Used to show the badge number in the Navbar bell icon.
exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.userId,
      read: false  // only count unread ones
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Called when the user opens the notifications panel.
// $set: { read: true } updates all matching documents in a single DB operation.
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false }, // only update unread ones
      { read: true }                          // mark them as read
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Users can only delete their own notifications.
// The recipient check prevents one user from deleting another user's notifications.
exports.remove = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ error: 'Not found' });

    // Security check: only the recipient can delete their notification
    if (notif.recipient.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
