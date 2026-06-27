const jwt = require('jsonwebtoken');
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
