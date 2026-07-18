const mongoose = require('mongoose');

// router.param handler: rejects malformed ObjectId route params with 400
// before the controller runs — otherwise Mongoose throws a CastError that
// surfaces as a 500, which is the wrong status for a client-side mistake.
// Not registered for message routes' :roomId, which is "userA_userB", not
// an ObjectId.
module.exports = (req, res, next, value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
};
