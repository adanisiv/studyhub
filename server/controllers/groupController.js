const Group = require('../models/Group');
const Notification = require('../models/Notification');
const notify = async (req, recipientId, data) => {
  const notif = await Notification.create(data);
  const populated = await notif.populate('sender', 'name avatar');
  const io = req.app.get('io');
  if (io) io.to(`user_${recipientId}`).emit('new_notification', populated);
};

// The creator automatically becomes the admin AND the first member.
// Members array always includes the admin so they can post in the group.
exports.create = async (req, res) => {
  try {
    const { name, description, subject, year, semester, department, isPrivate, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const group = await Group.create({
      name, description, subject, year, semester, department, isPrivate,
      tags: Array.isArray(tags) ? tags : [],
      admin: req.userId,        // the logged-in user becomes admin
      members: [req.userId]     // admin is automatically a member
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns public groups + any private groups the user is already a member of.
// Private groups the user has NOT joined are hidden from this listing.
exports.list = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { isPrivate: false },      // public groups: visible to everyone
        { members: req.userId }    // private groups: only visible to members
      ]
    }).populate('admin', 'name email'); // populate admin info for display
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supports filtering by name, year, semester, and department simultaneously.
// This is one of the two required "advanced search" features.
// All parameters are optional and can be combined.
exports.search = async (req, res) => {
  try {
    const filter = {};

    if (req.query.name) {
      // Escape regex special characters to prevent injection / ReDoS
      const escaped = req.query.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' }; // case-insensitive match
    }
    if (req.query.year) {
      filter.year = Number(req.query.year); // convert string query param to number
    }
    if (req.query.semester) {
      filter.semester = req.query.semester; // 'A', 'B', or 'Summer'
    }
    if (req.query.department) {
      const escaped = req.query.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.department = { $regex: escaped, $options: 'i' };
    }

    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag.toLowerCase().trim()] };
    }

    // Even in search results, only show groups the user is allowed to see
    filter.$or = [{ isPrivate: false }, { members: req.userId }];

    const groups = await Group.find(filter).populate('admin', 'name');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Populates admin, members, and pendingRequests so the detail page can render
// the full member list and pending join requests (if the viewer is the admin).
exports.getById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('pendingRequests', 'name email');

    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Block non-members from viewing private group details
    // .some() checks if the logged-in user's ID appears in the members array
    if (group.isPrivate && !group.members.some(m => m._id.toString() === req.userId)) {
      return res.status(403).json({ error: 'This group is private' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Only the group admin can edit group settings.
// Uses a whitelist to prevent unintended field changes (e.g. admin takeover).
exports.update = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // .toString() converts Mongoose ObjectId to string for === comparison
    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the group admin can edit' });
    }

    const allowed = ['name', 'description', 'subject', 'year', 'semester', 'department', 'isPrivate', 'tags'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) group[field] = req.body[field];
    });
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Only the admin can delete a group.
exports.remove = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the group admin can delete the group' });
    }
    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Public groups: user is added to members immediately.
// Private groups: user is added to pendingRequests, admin gets a notification.
exports.join = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Prevent duplicate membership (check with .some() + .toString() for ObjectId safety)
    if (group.members.some(m => m.toString() === req.userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    if (group.isPrivate) {
      // For private groups: queue the request and notify the admin
      if (group.pendingRequests.some(r => r.toString() === req.userId)) {
        return res.status(400).json({ error: 'Request already pending' });
      }
      group.pendingRequests.push(req.userId);
      await group.save();

      // Notify the group admin about the join request
      const User = require('../models/User');
      const sender = await User.findById(req.userId);
      await notify(req, group.admin.toString(), {
        recipient: group.admin,
        sender: req.userId,
        type: 'group_join',
        message: `${sender.name} wants to join ${group.name}`,
        group: group._id
      });

      return res.json({ message: 'Join request sent' });
    }

    // Public group: add immediately
    group.members.push(req.userId);
    await group.save();
    res.json({ message: 'Joined group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Only the admin can approve requests.
// Moves the user from pendingRequests → members and sends them a notification.
exports.approve = async (req, res) => {
  try {
    const { userId } = req.body; // the user being approved (not req.userId, which is the admin)
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only admin can approve requests' });
    }

    // Remove from pending queue
    group.pendingRequests = group.pendingRequests.filter(id => id.toString() !== userId);
    // Add to members
    group.members.push(userId);
    await group.save();

    // Notify the approved user
    const User = require('../models/User');
    const admin = await User.findById(req.userId);
    await notify(req, userId, {
      recipient: userId,
      sender: req.userId,
      type: 'group_approved',
      message: `${admin.name} approved you to join ${group.name}`,
      group: group._id
    });

    res.json({ message: 'User approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// The admin cannot leave — they must delete the group or transfer ownership.
// This prevents a group from becoming adminless.
exports.leave = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.admin.toString() === req.userId) {
      return res.status(400).json({ error: 'Admin cannot leave. Delete the group or transfer ownership.' });
    }

    // Filter out the leaving user from the members array
    group.members = group.members.filter(id => id.toString() !== req.userId);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
