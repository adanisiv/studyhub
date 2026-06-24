const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/conversations',    auth, ctrl.conversations);
router.get('/history/:roomId',  auth, ctrl.history);

module.exports = router;
