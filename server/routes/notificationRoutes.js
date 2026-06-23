const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/',         auth, ctrl.list);
router.get('/unread',   auth, ctrl.unreadCount);
router.put('/read-all', auth, ctrl.markAllRead);
router.delete('/:id',   auth, ctrl.remove);

module.exports = router;
