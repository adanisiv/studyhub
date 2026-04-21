const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/',          auth, ctrl.list);
router.get('/search',    auth, ctrl.search);
router.get('/:id',       auth, ctrl.getById);
router.put('/:id',       auth, ctrl.update);
router.delete('/:id',    auth, ctrl.remove);
router.post('/:id/friend',   auth, ctrl.addFriend);
router.delete('/:id/friend', auth, ctrl.removeFriend);

module.exports = router;
