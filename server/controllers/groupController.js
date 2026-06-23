const Group = require('../models/Group');
const Notification = require('../models/Notification');

const notify = async (req, recipientId, data) => {
  const notif = await Notification.create(data);
  const populated = await notif.populate('sender', 'name avatar');
  const io = req.app.get('io');
  if (io) io.to(`user_${recipientId}`).emit('new_notification', populated);
};

// POST /api/groups
exports.create = async (req, res) => {
  try {
    const { name, description, subject, year, semester, department, isPrivate } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const group = await Group.create({
      name, description, subject, year, semester, department, isPrivate,
      admin: req.userId,
      members: [req.userId]
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/groups
exports.list = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { isPrivate: false },
        { members: req.userId }
      ]
    }).populate('admin', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/groups/search — ADVANCED SEARCH #1
exports.search = async (req, res) => {
  try {
    const filter = {};
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.year) {
      filter.year = Number(req.query.year);
    }
    if (req.query.semester) {
      filter.semester = req.query.semester;
    }
    if (req.query.department) {
      filter.department = { $regex: req.query.department, $options: 'i' };
    }

    filter.$or = [{ isPrivate: false }, { members: req.userId }];

    const groups = await Group.find(filter).populate('admin', 'name');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/groups/:id
exports.getById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('pendingRequests', 'name email');

    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.isPrivate && !group.members.some(m => m._id.toString() === req.userId)) {
      return res.status(403).json({ error: 'This group is private' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/groups/:id
exports.update = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the group admin can edit' });
    }

    const allowed = ['name', 'description', 'subject', 'year', 'semester', 'department', 'isPrivate'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) group[field] = req.body[field];
    });
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/groups/:id
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

// POST /api/groups/:id/join
exports.join = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.members.includes(req.userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    if (group.isPrivate) {
      if (group.pendingRequests.includes(req.userId)) {
        return res.status(400).json({ error: 'Request already pending' });
      }
      group.pendingRequests.push(req.userId);
      await group.save();

      // notify admin about join request
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

    group.members.push(req.userId);
    await group.save();
    res.json({ message: 'Joined group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/groups/:id/approve
exports.approve = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only admin can approve requests' });
    }

    group.pendingRequests = group.pendingRequests.filter(id => id.toString() !== userId);
    group.members.push(userId);
    await group.save();

    // notify user that they were approved
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

// POST /api/groups/:id/leave
exports.leave = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() === req.userId) {
      return res.status(400).json({ error: 'Admin cannot leave. Delete the group or transfer ownership.' });
    }
    group.members = group.members.filter(id => id.toString() !== req.userId);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
