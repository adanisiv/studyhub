const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },           // e.g. 'Web Dev 2025'
  description: { type: String, default: '' },                          // optional longer description
  subject:     { type: String, default: '' },                          // e.g. 'JavaScript', 'Algorithms'
  year:        { type: Number, default: 1, min: 1, max: 4 },           // target academic year
  semester:    { type: String, enum: ['A', 'B', 'Summer'], default: 'A' }, // which semester
  department:  { type: String, default: '' },                          // e.g. 'Computer Science'

  // admin is the user who created the group (has moderation permissions)
  admin:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // members is an array of User ObjectIds (including the admin)
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // pendingRequests holds users who requested to join a private group
  // The admin can approve or deny these requests
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  isPrivate: { type: Boolean, default: false }, // if true, requires admin approval to join

  // tags is a free-form list of keywords for discovery and grouping
  // (e.g. ['javascript','exam-prep']) — same shape as Post.tags
  tags: [{ type: String, trim: true, lowercase: true }]
}, { timestamps: true }); // adds createdAt + updatedAt

// Compound index for filtering groups by department, year, and semester
// This is the most common search pattern (used in Advanced Search #1)
groupSchema.index({ department: 1, year: 1, semester: 1 });

// Index on members array — speeds up queries like "find all groups this user is in"
groupSchema.index({ members: 1 });

// Full-text search index on name and description (used for keyword search)
groupSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Group', groupSchema);
