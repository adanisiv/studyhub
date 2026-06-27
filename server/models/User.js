const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // bcrypt is the industry standard for password hashing

const userSchema = new mongoose.Schema({
  // Basic profile fields
  name:       { type: String, required: true, trim: true },       // trim removes leading/trailing spaces
  email:      { type: String, required: true, unique: true,       // unique creates a DB index
                lowercase: true, trim: true },                    // always stored in lowercase
  password:   { type: String, required: true, minlength: 6 },     // stored as a bcrypt hash, never plaintext
  department: { type: String, default: '' },                      // e.g. 'Computer Science'
  year:       { type: Number, default: 1, min: 1, max: 4 },       // academic year 1–4
  avatar:     { type: String, default: '' },                      // URL to profile picture (or empty)
  // Self-referencing array: each element is an ObjectId pointing to another User
  // ref: 'User' tells Mongoose how to populate these references
  friends:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role:       { type: String, enum: ['student', 'admin'], default: 'student' }
}, { timestamps: true }); // adds createdAt + updatedAt
// Indexes speed up queries. Without them, MongoDB does a full collection scan.

// Compound index: speeds up queries filtering by both department AND year
// (used in SearchPage and group filtering)
userSchema.index({ department: 1, year: 1 });

// Text index: enables full-text search on the name field
// (used for user search with $text queries)
userSchema.index({ name: 'text' });

// pre('save') hook runs automatically before any .save() or .create() call.
// This ensures the password is ALWAYS hashed — even if you forget to do it manually.
userSchema.pre('save', async function (next) {
  // Only re-hash if the password field actually changed.
  // Without this check, an update to 'name' would re-hash the already-hashed password.
  if (!this.isModified('password')) return next();

  // bcrypt.hash(password, saltRounds) — saltRounds=10 is the recommended value.
  // Higher rounds = more secure but slower. 10 takes ~100ms which is acceptable.
  this.password = await bcrypt.hash(this.password, 10);
  next(); // continue with the save operation
});

// Added to every User document instance (e.g. user.comparePassword('mypassword'))
// bcrypt.compare() hashes the candidate and compares it to the stored hash.
// This is secure because bcrypt hashes are one-way (cannot be reversed).
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Called automatically whenever a User document is serialized to JSON
// (e.g. when Express calls res.json(user)).
// This removes the password hash from API responses — it should never be sent to clients.
userSchema.methods.toJSON = function () {
  const obj = this.toObject(); // convert Mongoose document to plain JS object
  delete obj.password;         // remove the hashed password field
  return obj;
};

// Create and export the Mongoose model.
// The first arg 'User' becomes the MongoDB collection name 'users' (lowercase plural).
module.exports = mongoose.model('User', userSchema);
