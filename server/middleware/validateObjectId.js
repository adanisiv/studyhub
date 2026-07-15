const mongoose = require('mongoose');

// Express router.param handler — validates that a route parameter is a
// well-formed MongoDB ObjectId BEFORE the controller runs.
//
// Without this, a request like GET /api/posts/NOT_A_VALID_ID reaches
// Post.findById(), which throws a Mongoose CastError. The controller's
// try/catch then turns it into a confusing 500 ("Cast to ObjectId failed").
// A malformed id is a client mistake, so the correct response is 400.
//
// Registered per-router via router.param('id', validateObjectId) etc.,
// so it automatically guards every route that uses that parameter name.
// Note: it is intentionally NOT registered for message routes' :roomId,
// which is a composite "userA_userB" string, not an ObjectId.
module.exports = (req, res, next, value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
};
