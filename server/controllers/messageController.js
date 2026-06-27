const Message = require('../models/Message');
const User = require('../models/User');

// Returns all friends with their last message and unread count.
// Used in ChatPage to show the conversation list on the left sidebar.
exports.conversations = async (req, res) => {
  try {
    // Get the full user document with populated friends list
    const user = await User.findById(req.userId).populate('friends', 'name email department year');
    const friends = user.friends || [];

    // For each friend, compute the room, last message, and unread count in parallel
    const convs = await Promise.all(friends.map(async (friend) => {
      // Deterministic room ID: sort user IDs so both sides get the same ID
      const roomId = [req.userId, friend._id.toString()].sort().join('_');

      // Run both queries for this room in parallel
      const [lastMsg, unreadCount] = await Promise.all([
        // Get the most recent message in this room
        Message.findOne({ roomId }).sort({ createdAt: -1 }).populate('sender', 'name'),

        // Count messages from the friend that the current user hasn't read yet
        // $not + $elemMatch: readBy array does NOT contain req.userId
        Message.countDocuments({
          roomId,
          sender: friend._id,
          readBy: { $not: { $elemMatch: { $eq: req.userId } } }
        }),
      ]);

      return { friend, lastMsg, unreadCount, roomId };
    }));

    // Sort conversations: those with messages first, ordered by most recent activity
    convs.sort((a, b) => {
      const aTime = a.lastMsg?.createdAt ? new Date(a.lastMsg.createdAt) : 0;
      const bTime = b.lastMsg?.createdAt ? new Date(b.lastMsg.createdAt) : 0;
      return bTime - aTime; // descending (most recent first)
    });

    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Advanced search across messages within a single chat room.
// Parameters (all optional except roomId):
//   roomId   — required, the chat room to search in (security: must include user)
//   keyword  — text to look for inside the message body (case-insensitive regex)
//   dateFrom — only return messages on/after this date
//   dateTo   — only return messages on/before this date
//   sender   — only return messages sent by this user ID
//
// Verifies the user is a participant in the room before returning anything.
exports.search = async (req, res) => {
  try {
    const { roomId, keyword, dateFrom, dateTo, sender } = req.query;
    if (!roomId) return res.status(400).json({ error: 'roomId is required' });

    // Authorization: roomId is "userA_userB" — current user must be one of them
    const parts = roomId.split('_');
    if (parts.length !== 2 || !parts.includes(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filter = { roomId };
    if (keyword) {
      // Escape regex metacharacters to prevent ReDoS injection
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.text = { $regex: escaped, $options: 'i' };
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }
    if (sender) filter.sender = sender;

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })  // newest matches first for search results
      .limit(100)
      .populate('sender', 'name avatar');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns up to 200 messages for a specific chat room, oldest first.
// Before returning, verifies the requesting user is actually a participant
// in this room (security: can't read other people's chats).
exports.history = async (req, res) => {
  try {
    // A valid roomId is exactly two user IDs joined by '_'
    const parts = req.params.roomId.split('_');
    if (parts.length !== 2 || !parts.includes(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })          // oldest first (chronological for chat display)
      .limit(200)                       // cap at 200 messages per room
      .populate('sender', 'name avatar');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
