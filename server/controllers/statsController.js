const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');

// Returns 4 numbers shown at the top of the Feed and Stats pages.
// All 4 queries run in parallel via Promise.all for better performance.
exports.dashboard = async (req, res) => {
  try {
    const oneWeekAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000); // 7 days ago
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const [totalUsers, activeGroups, postsThisWeek, newMembers] = await Promise.all([
      User.countDocuments(),                                         // total registered users
      Group.countDocuments(),                                        // total groups (all, not just active)
      Post.countDocuments({ createdAt: { $gte: oneWeekAgo } }),     // posts in last 7 days
      User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),    // users who joined in last 30 days
    ]);

    res.json({ totalUsers, activeGroups, postsThisWeek, newMembers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Uses MongoDB aggregation to count posts grouped by month.
// This data powers the D3.js bar chart on StatsPage.
// Optional groupId filter shows activity for a specific group.
exports.postsPerMonth = async (req, res) => {
  try {
    const match = {};
    if (req.query.groupId) {
      // Convert groupId string to ObjectId for matching against the group field
      const mongoose = require('mongoose');
      match.group = new mongoose.Types.ObjectId(req.query.groupId);
    }

    // MongoDB Aggregation Pipeline:
    const data = await Post.aggregate([
      // Stage 1 — $match: filter to only the relevant posts
      { $match: match },

      // Stage 2 — $group: group posts by month (format: 'YYYY-MM')
      // $dateToString converts a date to a formatted string for grouping
      // count: { $sum: 1 } adds 1 for each document in the group
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
      }},

      // Stage 3 — $sort: sort months chronologically (ascending)
      { $sort: { _id: 1 } }
    ]);

    // Format YYYY-MM as "MMM YYYY" (e.g. "2026-03" → "Mar 2026") for the chart axis
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.json(data.map(d => {
      const [y, m] = d._id.split('-');
      const label = `${MONTH_NAMES[parseInt(m, 10) - 1] || m} ${y}`;
      return { month: label, count: d.count };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Powers the D3.js line chart on StatsPage.
// Returns an entry for EVERY day in the last 30 days (count=0 when no posts)
// so the line chart has consistent spacing on the X axis.
exports.dailyActivity = async (req, res) => {
  try {
    const days = 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0); // start of day

    const match = { createdAt: { $gte: since } };
    if (req.query.groupId) {
      const mongoose = require('mongoose');
      match.group = new mongoose.Types.ObjectId(req.query.groupId);
    }

    const raw = await Post.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
      }}
    ]);
    // Pivot the raw aggregation into a date-keyed lookup table
    const lookup = Object.fromEntries(raw.map(r => [r._id, r.count]));

    // Build a continuous series — fill in zeros for empty days
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      result.push({
        date: key,
        // Short label like "Jun 26" for the X axis
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: lookup[key] || 0
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Counts how many posts of each type exist (question, material, announcement).
// This data powers the D3.js pie chart on StatsPage.
exports.postTypes = async (req, res) => {
  try {
    const match = {};
    if (req.query.groupId) {
      const mongoose = require('mongoose');
      match.group = new mongoose.Types.ObjectId(req.query.groupId);
    }

    // Aggregation: group posts by their 'type' field and count each group
    const data = await Post.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 } } } // _id: '$type' groups by the type value
    ]);

    res.json(data.map(d => ({ type: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns a flat activity stream of the most recent likes + comments OTHER users
// left on this user's posts. Each entry has type, user, postPreview, and when.
exports.userActivity = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userIdStr = String(req.params.userId);

    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('likes', 'name avatar')
      .populate('comments.author', 'name avatar')
      .select('content likes comments createdAt');

    const activity = [];
    posts.forEach(p => {
      (p.likes || []).forEach(liker => {
        if (!liker) return;
        const actorId = String(liker._id || liker);
        if (actorId === userIdStr) return; // skip self-likes
        activity.push({
          type: 'like',
          user: { _id: liker._id, name: liker.name, avatar: liker.avatar },
          postId: p._id,
          postPreview: (p.content || '').slice(0, 80),
          when: p.createdAt
        });
      });
      (p.comments || []).forEach(c => {
        if (!c.author) return;
        const actorId = String(c.author._id || c.author);
        if (actorId === userIdStr) return; // skip self-comments
        activity.push({
          type: 'comment',
          user: { _id: c.author._id, name: c.author.name, avatar: c.author.avatar },
          postId: p._id,
          postPreview: (p.content || '').slice(0, 80),
          text: c.text,
          when: c.createdAt
        });
      });
    });

    activity.sort((a, b) => new Date(b.when) - new Date(a.when));
    res.json(activity.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns totalPosts, likesReceived, commentsReceived, and postsByType for the
// KPI tiles shown on the profile page.
exports.userStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    // Three aggregations in parallel: totals, likes/comments, type breakdown
    const [totals, postsByType] = await Promise.all([
      // Sum up likes and comments across all posts authored by this user
      Post.aggregate([
        { $match: { author: userId } },
        { $project: {
            likeCount: { $size: { $ifNull: ['$likes', []] } },
            commentCount: { $size: { $ifNull: ['$comments', []] } }
        }},
        { $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            likesReceived: { $sum: '$likeCount' },
            commentsReceived: { $sum: '$commentCount' }
        }}
      ]),
      // Count posts grouped by their type field for the breakdown
      Post.aggregate([
        { $match: { author: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    // Default 0 values when the user has no posts yet
    const summary = totals[0] || { totalPosts: 0, likesReceived: 0, commentsReceived: 0 };
    delete summary._id;

    res.json({
      ...summary,
      postsByType: postsByType.map(t => ({ type: t._id, count: t.count }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns the most-used tags from the last 7 days and the top 5 groups by members.
// Displayed in the Feed sidebar to help users discover popular content.
exports.trending = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const User = require('../models/User');

    // Determine which posts are relevant to this user's department
    // so trending tags reflect their field of study, not unrelated departments
    const currentUser = await User.findById(req.userId).select('department friends');
    const userDept = currentUser?.department || '';

    // Find groups in the user's department to scope trending tags
    const deptGroups = await Group.find({ department: userDept }).select('_id');
    const deptGroupIds = deptGroups.map(g => g._id);

    // Authors in same department
    const deptAuthors = await User.find({ department: userDept }).select('_id');
    const deptAuthorIds = deptAuthors.map(u => u._id);

    const [tags, groups] = await Promise.all([

      // Trending tags: scoped to the user's department (posts in dept groups OR by dept authors)
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo },
            tags: { $exists: true, $ne: [] },
            $or: [
              { group: { $in: deptGroupIds } },
              { author: { $in: deptAuthorIds }, group: null }
            ]
          }
        },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Top groups — scoped to user's department
      Group.aggregate([
        { $match: { department: userDept } },
        { $project: {
            name: 1,
            memberCount: { $size: '$members' },
            subject: 1
        }},
        { $sort: { memberCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      tags: tags.map(t => ({ tag: t._id, count: t.count })),
      groups
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
