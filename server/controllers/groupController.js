const Group = require('../models/Group');

// POST /api/groups — create group (creator becomes admin)
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

// GET /api/groups — list all public groups (+ private groups user is member of)
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

// GET /api/groups/search?name=...&year=...&semester=...&department=...
// ADVANCED SEARCH #1 — 4 parameters
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

    // only show public groups + groups user is member of
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

    // private group — only members can view
    if (group.isPrivate && !group.members.some(m => m._id.toString() === req.userId)) {
      return res.status(403).json({ error: 'This group is private' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/groups/:id — only admin can edit
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

// DELETE /api/groups/:id — only admin can delete
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

// POST /api/groups/:id/join — request to join (or join directly if public)
exports.join = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.members.includes(req.userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    if (group.isPrivate) {
      // add to pending
      if (group.pendingRequests.includes(req.userId)) {
        return res.status(400).json({ error: 'Request already pending' });
      }
      group.pendingRequests.push(req.userId);
      await group.save();
      return res.json({ message: 'Join request sent' });
    }

    // public group — join directly
    group.members.push(req.userId);
    await group.save();
    res.json({ message: 'Joined group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/groups/:id/approve — admin approves pending request
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
