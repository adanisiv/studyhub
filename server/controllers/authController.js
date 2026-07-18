const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Node's built-in crypto — no new dependency needed
const User = require('../models/User');

// Creates a signed token containing the user's ID and role.
// The token expires in 7 days; after that the user must log in again.
// The client stores this token in localStorage and sends it in the
// Authorization: Bearer <token> header on every API request.
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // payload — data embedded in the token
    process.env.JWT_SECRET,            // secret key — only the server knows this
    { expiresIn: '7d' }                // token validity period
  );
};

// Creates a new user account and returns a JWT so the user is immediately logged in.
// The password is NOT hashed here — the User model's pre('save') hook does it.
exports.register = async (req, res) => {
  try {
    const { name, email, password, department, year } = req.body;

    // Basic field presence check (express-validator also checks this, but as a safety net)
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if the email is already taken — email must be unique across all users
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create the user. The User schema's pre('save') hook will bcrypt the password.
    const user = await User.create({ name, email, password, department, year });

    // Generate JWT and send back the user object + token.
    // toJSON() strips the password field before returning.
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Authenticates an existing user and returns a new JWT.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Intentionally vague message — don't tell the client whether email exists
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // comparePassword() uses bcrypt.compare() to safely check the hashed password
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Credentials are correct — issue a new token
    const token = generateToken(user);
    res.json({ user, token }); // user.toJSON() removes the password field
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Forgot-password, step 1: generate a one-time reset token and store only its
// SHA-256 hash — a leaked database must not contain usable tokens, the same
// reason the password itself is bcrypt-hashed.
//
// No email service is configured in this project, so the raw token is returned
// in the response (devResetToken) for the client to present as a link. In
// production it would be emailed instead and never included in the response.
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If an account exists for this email, a reset link has been generated.' });
    }

    // A random 32-byte token, hex-encoded — this is what would go in the emailed link.
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Only the hash is persisted, same reasoning as bcrypt-ing the password.
    user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // valid for 1 hour
    await user.save();

    res.json({
      message: 'If an account exists for this email, a reset link has been generated.',
      devResetToken: rawToken // dev-only — see comment above
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Forgot-password, step 2: exchange a valid, unexpired token for a new
// password. The lookup matches the token's hash AND an unexpired timestamp
// in one query ($gt on resetPasswordExpires).
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    // Setting .password triggers the pre('save') hook, which bcrypt-hashes it.
    user.password = newPassword;
    // Single-use: clear the token so this same link can't be replayed.
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns the currently logged-in user's full profile (including friends list).
// Used by the React app on startup to hydrate the user state from a saved token.
exports.getMe = async (req, res) => {
  try {
    // req.userId is set by the auth middleware after verifying the JWT
    const user = await User.findById(req.userId)
      .populate('friends', 'name email avatar'); // replace friend ObjectIds with full objects
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
