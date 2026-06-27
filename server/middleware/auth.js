const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Read the Authorization header from the incoming HTTP request
  const header = req.headers.authorization;

  // The header must exist and follow the "Bearer <token>" format
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Extract the token part after "Bearer "
    const token = header.split(' ')[1];

    // jwt.verify() checks:
    //   1. The token's signature (was it signed with our secret?)
    //   2. The token's expiry (has it expired?)
    // If either check fails, it throws an error (caught below)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request object.
    // Controllers use req.userId to fetch or modify data belonging to this user.
    req.userId   = decoded.id;
    req.userRole = decoded.role;

    next(); // token is valid — proceed to the controller
  } catch (err) {
    // Token is expired, malformed, or signed with a different secret
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
