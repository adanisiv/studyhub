const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  content:  { type: String, required: true },
  type:     { type: String, enum: ['question', 'material', 'announcement'], default: 'question' },
  tags:     [{ type: String, trim: true }],
  mediaUrl: { type: String, default: '' },           // image or video url
  mediaType:{ type: String, enum: ['image', 'video', ''], default: '' },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group:    { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  comments: [commentSchema],
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
