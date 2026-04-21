const Post = require('../models/Post');

// GET /api/stats/posts-per-month?groupId=...
// returns { month: 'YYYY-MM', count } for D3 line/bar chart
exports.postsPerMonth = async (req, res) => {
  try {
    const match = {};
    if (req.query.groupId) {
      const mongoose = require('mongoose');
      match.group = new mongoose.Types.ObjectId(req.query.groupId);
    }

    const data = await Post.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(data.map(d => ({ month: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/stats/post-types?groupId=...
// returns { type, count } for D3 pie chart
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
