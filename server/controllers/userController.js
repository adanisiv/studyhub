const User = require('../models/User');
const Notification = require('../models/Notification');

const notify = async (req, recipientId, data) => {
  const notif = await Notification.create(data);
  const populated = await notif.populate('sender', 'name avatar');
  const io = req.app.get('io');
  if (io) io.to(`user_${recipientId}`).emit('new_notification', populated);
};

// GET /api/users
exports.list = async (req, res) => {
  try {
    const users = await User.find().select('name email department year avatar');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/search
exports.search = async (req, res) => {
  try {
    const filter = {};
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.department) {
      filter.department = { $regex: req.query.department, $options: 'i' };
    }
    if (req.query.year) {
      filter.year = Number(req.query.year);
    }
    const users = await User.find(filter).select('name email department year avatar');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/:id
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email department year avatar friends')
      .populate('friends', 'name email avatar');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/users/:id
exports.update = async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    const allowed = ['name', 'department', 'year', 'avatar'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id
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

// POST /api/users/:id/friend
exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId is required' });
    if (friendId === req.userId) return res.status(400).json({ error: 'Cannot friend yourself' });

    const user = await User.findById(req.userId);
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    user.friends.push(friendId);
    await user.save();

    await User.findByIdAndUpdate(friendId, { $addToSet: { friends: req.userId } });

    // notify the other user
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

// DELETE /api/users/:id/friend
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
