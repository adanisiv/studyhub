const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/',          auth, ctrl.list);        // GET  /api/users         — list all users (excl. self)
router.get('/search',    auth, ctrl.search);      // GET  /api/users/search  — filter by name/dept/year
router.get('/me',        auth, ctrl.getMe);       // GET  /api/users/me      — get own fresh profile
router.get('/:id',       auth, ctrl.getById);     // GET  /api/users/:id     — get user profile
router.put('/:id',       auth, ctrl.update);      // PUT  /api/users/:id     — update own profile
router.delete('/:id',    auth, ctrl.remove);      // DELETE /api/users/:id  — delete own account
router.post('/:id/friend',   auth, ctrl.addFriend);    // POST   /api/users/:id/friend — add friend
router.delete('/:id/friend', auth, ctrl.removeFriend); // DELETE /api/users/:id/friend — remove friend

module.exports = router;
