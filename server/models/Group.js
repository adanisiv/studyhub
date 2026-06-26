const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject:     { type: String, default: '' },
  year:        { type: Number, default: 1, min: 1, max: 4 },
  semester:    { type: String, enum: ['A', 'B', 'Summer'], default: 'A' },
  department:  { type: String, default: '' },
  admin:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate:   { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
