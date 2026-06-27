const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');                             // JWT verification
const { registerRules, loginRules } = require('../middleware/validate'); // input validation

// POST /register — Create a new account
// registerRules validates name, email, password before reaching the controller
router.post('/register', registerRules, ctrl.register);

// POST /login — Authenticate and receive a JWT
// loginRules validates email format and password presence
router.post('/login', loginRules, ctrl.login);

// GET /me — Get the logged-in user's full profile
// auth middleware verifies the JWT and attaches req.userId
router.get('/me', auth, ctrl.getMe);

module.exports = router;
