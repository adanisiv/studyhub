const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerRules, loginRules } = require('../middleware/validate');

router.post('/register', registerRules, ctrl.register);
router.post('/login', loginRules, ctrl.login);
router.get('/me', auth, ctrl.getMe);

module.exports = router;
