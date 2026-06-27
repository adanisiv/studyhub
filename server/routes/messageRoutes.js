const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/conversations',    auth, ctrl.conversations);  // GET /api/messages/conversations   — chat list
router.get('/search',           auth, ctrl.search);         // GET /api/messages/search          — search in a room
router.get('/history/:roomId',  auth, ctrl.history);        // GET /api/messages/history/:roomId — load messages

module.exports = router;
