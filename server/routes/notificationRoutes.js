const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// Reject malformed ObjectIds early (→ 400). /unread and /read-all are literal
// routes defined before /:id, so they are unaffected.
router.param('id', validateObjectId);

router.get('/',         auth, ctrl.list);         // GET    /api/notifications        — list recent (30)
router.get('/unread',   auth, ctrl.unreadCount);  // GET    /api/notifications/unread — badge count
router.put('/read-all', auth, ctrl.markAllRead);  // PUT    /api/notifications/read-all — mark all read
router.delete('/:id',   auth, ctrl.remove);       // DELETE /api/notifications/:id   — delete one

module.exports = router;
