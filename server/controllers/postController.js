const Post = require('../models/Post');
const Group = require('../models/Group');

// POST /api/posts — create a post
exports.create = async (req, res) => {
  try {
    const { content, type, tags, mediaUrl, mediaType, group } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    // if posting to a group, verify membership
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

// GET /api/posts/feed — posts from user's groups + friends
exports.feed = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    // groups the user belongs to
    const groups = await Group.find({ members: req.userId }).select('_id');
    const groupIds = groups.map(g => g._id);

    const posts = await Post.find({
      $or: [
        { group: { $in: groupIds } },                 // posts in my groups
        { author: { $in: user.friends }, group: null }, // friends' personal posts
        { author: req.userId }                          // my own posts
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

// GET /api/posts/my — all posts by current user
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

// GET /api/posts/group/:groupId — posts in a specific group
exports.byGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // private group check
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

// GET /api/posts/search?keyword=...&type=...&dateFrom=...&dateTo=...&tag=...
// ADVANCED SEARCH #2 — 4 parameters
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

// PUT /api/posts/:id — only author can edit (or group admin)
exports.update = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // check: is user the author?
    let canEdit = post.author.toString() === req.userId;

    // check: is user the group admin?
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

// DELETE /api/posts/:id — author or group admin
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
    res.json(populated);
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
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
