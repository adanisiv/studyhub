const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');

// GET /api/stats/dashboard
exports.dashboard = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeGroups, postsThisWeek, newMembers] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
    ]);
    res.json({ totalUsers, activeGroups, postsThisWeek, newMembers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/stats/posts-per-month?groupId=...
exports.postsPerMonth = async (req, res) => {
  try {
    const match = {};
    if (req.query.groupId) {
      const mongoose = require('mongoose');
      match.group = new mongoose.Types.ObjectId(req.query.groupId);
    }
    const data = await Post.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data.map(d => ({ month: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/stats/post-types?groupId=...
exports.postTypes = async (req, res) => {
  try {
    const match = {};
    if (req.query.groupId) {
      const mongoose = require('mongoose');
      match.group = new mongoose.Types.ObjectId(req.query.groupId);
    }
    const data = await Post.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    res.json(data.map(d => ({ type: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/stats/trending
exports.trending = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [tags, groups] = await Promise.all([
      Post.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo }, tags: { $exists: true, $ne: [] } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Group.aggregate([
        { $project: { name: 1, memberCount: { $size: '$members' }, subject: 1 } },
        { $sort: { memberCount: -1 } },
        { $limit: 5 }
      ])
    ]);
    res.json({ tags: tags.map(t => ({ tag: t._id, count: t.count })), groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
