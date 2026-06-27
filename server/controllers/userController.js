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
      .select('name email department year avatar friends')
      .populate('friends', 'name email avatar'); // replace ObjectId refs with full objects
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
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

// Adding a friend is BIDIRECTIONAL: both users get each other added.
// This mirrors how most social networks work (mutual connection, not a follow).
exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId is required' });
    if (friendId === req.userId) return res.status(400).json({ error: 'Cannot friend yourself' });

    const user = await User.findById(req.userId);

    // Check if they're already friends (using .toString() to compare ObjectId vs String)
    if (user.friends.some(f => f.toString() === friendId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Add friend to the requesting user's friends list
    user.friends.push(friendId);
    await user.save();

    // $addToSet is like $push but prevents duplicates — safely adds to the other user's list
    await User.findByIdAndUpdate(friendId, { $addToSet: { friends: req.userId } });

    // Notify the other user that someone added them as a friend
    await notify(req, friendId, {
      recipient: friendId,
      sender: req.userId,
      type: 'friend_request',
      message: `${user.name} added you as a friend`
    });

    res.json({ message: 'Friend added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Also bidirectional: removes each user from the other's friends list.
// $pull removes a specific value from an array field.
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    await User.findByIdAndUpdate(req.userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.userId } });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
