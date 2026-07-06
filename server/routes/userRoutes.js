const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/',          auth, ctrl.list);        // GET  /api/users         — list all users (excl. self)
router.get('/search',    auth, ctrl.search);      // GET  /api/users/search  — filter by name/dept/year
router.get('/me',        auth, ctrl.getMe);       // GET  /api/users/me      — get own fresh profile
router.get('/:id',       auth, ctrl.getById);     // GET  /api/users/:id     — get user profile
router.put('/:id',       auth, ctrl.update);      // PUT  /api/users/:id     — update own profile
router.delete('/:id',    auth, ctrl.remove);      // DELETE /api/users/:id  — delete own account
router.post('/:id/friend',        auth, ctrl.addFriend);    // POST   /api/users/:id/friend        — send friend request
router.post('/:id/friend/accept', auth, ctrl.acceptFriend); // POST   /api/users/:id/friend/accept — accept a pending request
router.delete('/:id/friend',      auth, ctrl.removeFriend); // DELETE /api/users/:id/friend        — unfriend / cancel / decline

module.exports = router;
