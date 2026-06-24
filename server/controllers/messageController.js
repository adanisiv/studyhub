const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/conversations
// Returns all friends with last message + unread count per conversation
exports.conversations = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'name email department year');
    const friends = user.friends || [];

    const convs = await Promise.all(friends.map(async (friend) => {
      const roomId = [req.userId, friend._id.toString()].sort().join('_');
      const [lastMsg, unreadCount] = await Promise.all([
        Message.findOne({ roomId }).sort({ createdAt: -1 }).populate('sender', 'name'),
        Message.countDocuments({
          roomId,
          sender: friend._id,
          readBy: { $not: { $elemMatch: { $eq: req.userId } } }
        }),
      ]);
      return { friend, lastMsg, unreadCount, roomId };
    }));

    // Sort: conversations with messages first, then by recency
    convs.sort((a, b) => {
      const aTime = a.lastMsg?.createdAt ? new Date(a.lastMsg.createdAt) : 0;
      const bTime = b.lastMsg?.createdAt ? new Date(b.lastMsg.createdAt) : 0;
      return bTime - aTime;
    });

    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/messages/history/:roomId
exports.history = async (req, res) => {
  try {
    // Verify the requesting user is a participant in this room
    const parts = req.params.roomId.split('_');
    if (parts.length !== 2 || !parts.includes(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('sender', 'name avatar');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
