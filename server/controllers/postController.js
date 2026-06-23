const Post = require('../models/Post');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

// helper: send real-time notification
const notify = async (req, recipientId, data) => {
  const notif = await Notification.create(data);
  const populated = await notif.populate('sender', 'name avatar');
  const io = req.app.get('io');
  if (io) io.to(`user_${recipientId}`).emit('new_notification', populated);
};

// POST /api/posts — create a post
exports.create = async (req, res) => {
  try {
    const { content, type, tags, mediaUrl, mediaType, group } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    if (group) {
      const g = await Group.findById(group);
      if (!g) return res.status(404).json({ error: 'Group not found' });
      if (!g.members.includes(req.userId)) {
        return res.status(403).json({ error: 'You must be a member to post in this group' });
      }
    }

    const post = await Post.create({
      content, type, tags, mediaUrl, mediaType,
      author: req.userId,
      group: group || null
    });

    const populated = await post.populate('author', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/posts/feed
exports.feed = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    const groups = await Group.find({ members: req.userId }).select('_id');
    const groupIds = groups.map(g => g._id);

    const posts = await Post.find({
      $or: [
        { group: { $in: groupIds } },
        { author: { $in: user.friends }, group: null },
        { author: req.userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'name email avatar')
      .populate('group', 'name')
      .populate('comments.author', 'name avatar');

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/posts/my
exports.myPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .populate('group', 'name');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/posts/group/:groupId
exports.byGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.isPrivate && !group.members.includes(req.userId)) {
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

// GET /api/posts/search — ADVANCED SEARCH #2
exports.search = async (req, res) => {
  try {
    const filter = {};

    if (req.query.keyword) {
      filter.content = { $regex: req.query.keyword, $options: 'i' };
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'name email avatar')
      .populate('group', 'name');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/posts/:id
exports.getById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('group', 'name')
      .populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/posts/:id
exports.update = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let canEdit = post.author.toString() === req.userId;
    if (!canEdit && post.group) {
      const group = await Group.findById(post.group);
      if (group && group.admin.toString() === req.userId) canEdit = true;
    }
    if (!canEdit) return res.status(403).json({ error: 'Not allowed to edit this post' });

    const allowed = ['content', 'type', 'tags', 'mediaUrl', 'mediaType'];
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

// DELETE /api/posts/:id
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

// POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ author: req.userId, text });
    await post.save();
    const populated = await post.populate('comments.author', 'name avatar');

    // notify post author about the comment
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

// DELETE /api/posts/:postId/comment/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

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

    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/posts/:id/like — toggle like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const idx = post.likes.indexOf(req.userId);
    if (idx === -1) {
      post.likes.push(req.userId);

      // notify post author about the like
      if (post.author.toString() !== req.userId) {
        const User = require('../models/User');
        const sender = await User.findById(req.userId);
        await notify(req, post.author.toString(), {
          recipient: post.author,
          sender: req.userId,
          type: 'like',
          message: `${sender.name} liked your post`,
          post: post._id
        });
      }
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
