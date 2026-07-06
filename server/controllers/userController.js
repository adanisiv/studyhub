const User = require('../models/User');
const Notification = require('../models/Notification');

// Creates a notification in the DB AND immediately emits it to the recipient
// via Socket.io if they are currently online.
const notify = async (req, recipientId, data) => {
  const notif = await Notification.create(data);
  // Populate the sender field so the UI can display their name and avatar
  const populated = await notif.populate('sender', 'name avatar');
  const io = req.app.get('io'); // io was attached to app in server.js
  if (io) io.to(`user_${recipientId}`).emit('new_notification', populated);
};

// Returns the currently logged-in user's own fresh profile (used on app load to sync localStorage).
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email department year avatar role friends friendRequestsSent');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns all users EXCEPT the logged-in user (so you can't add yourself as a friend).
// Only returns the fields needed for the UI; password is always excluded by toJSON().
exports.list = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }) // $ne = "not equal"
      .select('name email department year avatar'); // only return needed fields
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supports filtering by name, department, and year simultaneously.
// All filters are optional and can be combined (e.g. name=alice&department=cs&year=2).
// Uses case-insensitive regex for flexible name/department matching.
exports.search = async (req, res) => {
  try {
    const filter = {};

    if (req.query.name) {
      const raw = req.query.name.trim();
      // Build a fuzzy subsequence pattern: each character in the query may have
      // any characters between it and the next one.
      // e.g. "dn"  → /d.*n/i  — matches "Dan", "Dean", "Donald"
      //      "siv" → /s.*i.*v/i — matches "Sivan", "Silvio"
      // Each character is escaped individually before joining so special chars are safe.
      const fuzzyPattern = raw
        .split('')
        .map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*');
      filter.name = { $regex: fuzzyPattern, $options: 'i' };
    }

    if (req.query.department) {
      const escaped = req.query.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.department = { $regex: escaped, $options: 'i' };
    }

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    // Always exclude the logged-in user from search results
    filter._id = { $ne: req.userId };

    const users = await User.find(filter).select('name email department year avatar');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetches a single user's profile and populates their friends list.
// Used on the profile page to show who their friends are.
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email department year avatar friends friendRequestsSent friendRequestsReceived')
      .populate('friends', 'name email avatar department'); // replace ObjectId refs with full objects
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Compute the relationship between the viewer (req.userId) and this profile,
    // so the client can show the right button without a second request.
    const viewerId = req.userId;
    let friendStatus = 'none';
    if (viewerId === String(user._id)) {
      friendStatus = 'self';
    } else if (user.friends.some(f => String(f._id) === viewerId)) {
      friendStatus = 'friends';
    } else if (user.friendRequestsReceived.some(id => String(id) === viewerId)) {
      // This profile's "received" list contains the viewer → viewer sent them a request
      friendStatus = 'pending_sent';
    } else if (user.friendRequestsSent.some(id => String(id) === viewerId)) {
      // This profile's "sent" list contains the viewer → they sent the viewer a request
      friendStatus = 'pending_received';
    }

    const obj = user.toObject();
    delete obj.friendRequestsSent;
    delete obj.friendRequestsReceived;
    obj.friendStatus = friendStatus;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Users can only edit their OWN profile (enforced by comparing :id with req.userId).
// Uses a whitelist (allowed array) to prevent mass-assignment of sensitive fields
// like 'password', 'role', or 'email' through this endpoint.
exports.update = async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    // Only allow updating these specific fields (security: prevents role escalation)
    const allowed = ['name', 'department', 'year', 'avatar'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // { new: true } returns the updated document; { runValidators: true } runs schema validation
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Users can only delete their OWN account.
exports.remove = async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sends a friend request — does NOT add either user to the other's friends list yet.
// The recipient must explicitly Accept (see acceptFriendRequest) before they become friends.
// Special case: if the target user already sent ME a pending request, this just
// accepts that existing request instead of creating a redundant second one.
exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId is required' });
    if (friendId === req.userId) return res.status(400).json({ error: 'Cannot friend yourself' });

    const user = await User.findById(req.userId);
    const target = await User.findById(friendId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (user.friends.some(f => f.toString() === friendId)) {
      return res.status(400).json({ error: 'Already friends' });
    }
    if (user.friendRequestsSent.some(f => f.toString() === friendId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // They already asked me first — accept it directly instead of a duplicate request.
    if (user.friendRequestsReceived.some(f => f.toString() === friendId)) {
      await User.findByIdAndUpdate(req.userId, {
        $pull: { friendRequestsReceived: friendId },
        $addToSet: { friends: friendId }
      });
      await User.findByIdAndUpdate(friendId, {
        $pull: { friendRequestsSent: req.userId },
        $addToSet: { friends: req.userId }
      });
      await notify(req, friendId, {
        recipient: friendId,
        sender: req.userId,
        type: 'friend_accept',
        message: `${user.name} accepted your friend request`
      });
      return res.json({ message: 'Friend request accepted', status: 'friends' });
    }

    // Normal case: create a new pending request in both directions' tracking arrays.
    await User.findByIdAndUpdate(req.userId, { $addToSet: { friendRequestsSent: friendId } });
    await User.findByIdAndUpdate(friendId, { $addToSet: { friendRequestsReceived: req.userId } });

    await notify(req, friendId, {
      recipient: friendId,
      sender: req.userId,
      type: 'friend_request',
      message: `${user.name} sent you a friend request`
    });

    res.json({ message: 'Friend request sent', status: 'pending_sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accepts a pending friend request FROM requesterId (must be in my friendRequestsReceived).
exports.acceptFriend = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId) return res.status(400).json({ error: 'requesterId is required' });

    const user = await User.findById(req.userId);
    if (!user.friendRequestsReceived.some(f => f.toString() === requesterId)) {
      return res.status(400).json({ error: 'No pending request from this user' });
    }

    await User.findByIdAndUpdate(req.userId, {
      $pull: { friendRequestsReceived: requesterId },
      $addToSet: { friends: requesterId }
    });
    await User.findByIdAndUpdate(requesterId, {
      $pull: { friendRequestsSent: req.userId },
      $addToSet: { friends: req.userId }
    });

    await notify(req, requesterId, {
      recipient: requesterId,
      sender: req.userId,
      type: 'friend_accept',
      message: `${user.name} accepted your friend request`
    });

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handles THREE cases with one endpoint, since they're all "sever any pending
// relationship with this user" and each $pull is a no-op if it doesn't apply:
//   1. Unfriend an existing friend
//   2. Cancel a request I sent that's still pending
//   3. Decline a request someone sent me
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId, friendRequestsSent: friendId, friendRequestsReceived: friendId }
    });
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId, friendRequestsSent: req.userId, friendRequestsReceived: req.userId }
    });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
