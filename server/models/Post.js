const mongoose = require('mongoose');
// Comments are stored INSIDE the post document (embedded, not a separate collection).
// This is efficient for reading posts with their comments in a single DB query.
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true },
}, { timestamps: true }); // adds createdAt to each comment
const postSchema = new mongoose.Schema({
  content:  { type: String, required: true },        // the post body text

  // Post type controls how it's displayed (colored badge, filtering, etc.)
  type:     { type: String, enum: ['question', 'material', 'announcement'], default: 'question' },

  // Tags are free-form keywords for filtering and trending (e.g. ['javascript', 'react'])
  tags:     [{ type: String, trim: true }],

  // Media attachment fields — all three must be consistent with each other
  mediaUrl:          { type: String, default: '' },  // public URL to the uploaded file
  mediaType:         { type: String, enum: ['image', 'video', 'file', ''], default: '' },
  mediaOriginalName: { type: String, default: '' },  // original filename before server renaming

  // author is required — every post must have a creator
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // group is optional — null means it's a personal post (visible in friends' feeds)
  group:  { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  // Embedded comments array — up to ~100 comments stored inside the post document
  comments: [commentSchema],

  // likes is an array of User ObjectIds — each user can appear at most once
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true }); // adds createdAt + updatedAt to the post

// Most common query: "get posts for this group, newest first"
// This compound index covers both the filter (group) and sort (createdAt)
postSchema.index({ group: 1, createdAt: -1 });

// For "My Posts" page: all posts by a user, newest first
postSchema.index({ author: 1, createdAt: -1 });

// For tag-based filtering (e.g. posts tagged with 'javascript')
postSchema.index({ tags: 1 });

// Full-text search index on post content (used in Advanced Search #2)
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);
