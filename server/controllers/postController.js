const Post = require('../models/Post');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const notify = async (req, recipientId, data) => {
  const notif = await Notification.create(data);
  const populated = await notif.populate('sender', 'name avatar');
  const io = req.app.get('io');
  if (io) io.to(`user_${recipientId}`).emit('new_notification', populated);
};

// Posts can optionally include a media attachment (mediaUrl + mediaType + mediaOriginalName)
// that was previously uploaded via POST /api/upload.
// If a groupId is provided, the user must be a member of that group.
exports.create = async (req, res) => {
  try {
    const { content, type, tags, mediaUrl, mediaType, mediaOriginalName, group } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    if (group) {
      // Verify the group exists and the user is a member before allowing posts
      const g = await Group.findById(group);
      if (!g) return res.status(404).json({ error: 'Group not found' });
      // .some + .toString avoids ObjectId-vs-string comparison pitfalls
      // (native .includes uses === which is always false for ObjectId vs string)
      if (!g.members.some(m => m.toString() === req.userId)) {
        return res.status(403).json({ error: 'You must be a member to post in this group' });
      }
    }

    const post = await Post.create({
      content, type, tags,
      mediaUrl,          // public URL to the uploaded file
      mediaType,         // 'image', 'video', or 'file'
      mediaOriginalName, // original filename shown to users (e.g. "homework.docx")
      author: req.userId,
      group: group || null // null means personal post (shows in friends' feeds)
    });

    // Populate author info so the UI can display name and avatar immediately
    const populated = await post.populate('author', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns posts relevant to the logged-in user using an $or query.
// Pagination is implemented with skip + limit (page-based, not cursor-based).
exports.feed = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    // Clamp page to at least 1; clamp limit to at most 50 (prevent large queries)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit; // e.g. page 2 with limit 15 → skip 15

    // Find all groups the user belongs to
    const groups = await Group.find({ members: req.userId }).select('_id');
    const groupIds = groups.map(g => g._id);

    // The feed query: show posts from:
    //   1. Any group the user is a member of
    //   2. Friends' personal posts (group === null)
    //   3. The user's own posts
    const query = {
      $or: [
        { group: { $in: groupIds } },              // group posts from user's groups
        { author: { $in: user.friends }, group: null }, // friends' personal posts
        { author: req.userId }                     // user's own posts
      ]
    };

    // Run both queries in parallel for efficiency (Promise.all)
    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })          // newest posts first
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email avatar')
        .populate('group', 'name')
        .populate('comments.author', 'name avatar'),
      Post.countDocuments(query)          // needed to compute total pages
    ]);

    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Used on the Profile page to show the user's posting history.
exports.myPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .populate('group', 'name'); // show which group each post belongs to
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.byUser = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name email avatar')
      .populate('group', 'name')
      .populate('comments.author', 'name avatar');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Used on the Group Detail page. Blocks access to private groups for non-members.
exports.byGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.isPrivate && !group.members.some(m => m.toString() === req.userId)) {
      return res.status(403).json({ error: 'You are not a member of this private group' });
    }

    const posts = await Post.find({ group: req.params.groupId })
      .sort({ createdAt: -1 })
      .populate('author', 'name email avatar')
      .populate('comments.author', 'name avatar');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supports filtering by keyword, type, tag, and date range simultaneously.
// This is the second required "advanced search" (the first is for groups/users).
// All parameters are optional and can be combined freely.
exports.search = async (req, res) => {
  try {
    const filter = {};

    if (req.query.keyword) {
      // Case-insensitive regex search on post content
      // Escape user input to prevent ReDoS attacks
      const escaped = req.query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.content = { $regex: escaped, $options: 'i' };
    }

    if (req.query.type) {
      filter.type = req.query.type; // exact match: 'question', 'material', or 'announcement'
    }

    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] }; // post must have this tag in its tags array
    }

    // Date range filter using MongoDB comparison operators
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom); // >= from date
      if (req.query.dateTo)   filter.createdAt.$lte = new Date(req.query.dateTo);   // <= to date
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(50) // cap results to prevent overloading
      .populate('author', 'name email avatar')
      .populate('group', 'name');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('group', 'name')
      .populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Same privacy boundary as byGroup: a post in a private group is only
    // visible to its members, even when fetched directly by post ID.
    if (post.group) {
      const group = await Group.findById(post.group._id);
      if (group && group.isPrivate && !group.members.some(m => m.toString() === req.userId)) {
        return res.status(403).json({ error: 'You are not a member of this private group' });
      }
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// The post author OR the group admin can edit a post.
// Uses a whitelist to prevent unexpected field changes.
exports.update = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check if the requester is the author or the group's admin
    let canEdit = post.author.toString() === req.userId;
    if (!canEdit && post.group) {
      const group = await Group.findById(post.group);
      if (group && group.admin.toString() === req.userId) canEdit = true;
    }
    if (!canEdit) return res.status(403).json({ error: 'Not allowed to edit this post' });

    // Whitelist of updatable fields
    const allowed = ['content', 'type', 'tags', 'mediaUrl', 'mediaType', 'mediaOriginalName'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });
    await post.save();
    const populated = await post.populate('author', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// The post author OR the group admin can delete a post (moderation).
exports.remove = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let canDelete = post.author.toString() === req.userId;
    if (!canDelete && post.group) {
      const group = await Group.findById(post.group);
      if (group && group.admin.toString() === req.userId) canDelete = true;
    }
    if (!canDelete) return res.status(403).json({ error: 'Not allowed to delete this post' });

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Comments are embedded inside the post document (subdocuments).
// After saving, notify the post author if the commenter is a different user.
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // .push() on a Mongoose subdocument array automatically creates an _id for the comment
    post.comments.push({ author: req.userId, text });
    await post.save();

    // Repopulate comment authors so the new comment has full author data
    const populated = await post.populate('comments.author', 'name avatar');

    // Send notification to the post author (but not if they commented on their own post)
    if (post.author.toString() !== req.userId) {
      const User = require('../models/User');
      const sender = await User.findById(req.userId);
      await notify(req, post.author.toString(), {
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        message: `${sender.name} commented on your post`,
        post: post._id
      });
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// The comment author, the post author, or the group admin can delete a comment.
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // .id() on a Mongoose subdocument array finds a subdoc by its _id
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Determine if the requester has permission to delete
    const isCommentAuthor = comment.author.toString() === req.userId;
    const isPostAuthor = post.author.toString() === req.userId;
    let isGroupAdmin = false;
    if (post.group) {
      const group = await Group.findById(post.group);
      if (group && group.admin.toString() === req.userId) isGroupAdmin = true;
    }

    if (!isCommentAuthor && !isPostAuthor && !isGroupAdmin) {
      return res.status(403).json({ error: 'Not allowed to delete this comment' });
    }

    // .pull() removes a subdocument from the array by its _id
    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns the list of users who liked a post (name + _id only).
exports.getLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('likes', 'name _id');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Calling this endpoint toggles: like if not liked, unlike if already liked.
// We use .some() with .toString() because req.userId is a string but post.likes
// contains Mongoose ObjectIds — direct indexOf/=== comparison always fails.
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // .toString() on a Mongoose ObjectId gives the hex string, making comparison safe
    const alreadyLiked = post.likes.some(id => id.toString() === req.userId);

    if (alreadyLiked) {
      // .pull() handles ObjectId-to-string casting internally — safe to pass a string
      post.likes.pull(req.userId);
      // Note: we intentionally do NOT delete the like notification here.
      // Combined with the dedupe below, this means like→unlike→like cycles
      // produce exactly one notification total instead of one per click.
    } else {
      post.likes.push(req.userId);

      // Notify the post author about the like (not if they liked their own post).
      // Deduped: repeated like/unlike cycles must not stack multiple notifications
      // for the same (sender, post) pair.
      if (post.author.toString() !== req.userId) {
        const exists = await Notification.findOne({
          recipient: post.author, sender: req.userId, type: 'like', post: post._id
        });
        if (!exists) {
          const User = require('../models/User');
          const sender = await User.findById(req.userId);
          if (sender) {
            await notify(req, post.author.toString(), {
              recipient: post.author,
              sender: req.userId,
              type: 'like',
              message: `${sender.name} liked your post`,
              post: post._id
            });
          }
        }
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
