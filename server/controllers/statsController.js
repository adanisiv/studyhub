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

// Returns aggregated stats for a single user:
//   • totalPosts: posts they've authored
//   • likesReceived: total likes across all their posts
//   • commentsReceived: total comments across all their posts
//   • postsByType: { question, material, announcement } counts for their pie chart
//
// Used to enrich the user profile page with at-a-glance numbers.
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

    // Run both aggregations in parallel
    const [tags, groups] = await Promise.all([

      // Trending tags: count tag occurrences in recent posts
      Post.aggregate([
        // Filter to recent posts that actually have tags
        { $match: { createdAt: { $gte: oneWeekAgo }, tags: { $exists: true, $ne: [] } } },
        // $unwind: splits the tags array so each tag becomes its own document
        // e.g. post with tags: ['js', 'react'] becomes two separate documents
        { $unwind: '$tags' },
        // Count occurrences of each tag string
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, // most popular first
        { $limit: 10 }            // top 10 tags
      ]),

      // Top groups by member count
      Group.aggregate([
        { $project: {
            name: 1,
            // $size computes the length of the members array at query time
            memberCount: { $size: '$members' },
            subject: 1
        }},
        { $sort: { memberCount: -1 } }, // most members first
        { $limit: 5 }                   // top 5 groups
      ])
    ]);

    res.json({
      tags: tags.map(t => ({ tag: t._id, count: t.count })),
      groups // already has name, memberCount, subject
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
