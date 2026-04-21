const router = require('express').Router();
const ctrl = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.post('/',            auth, ctrl.create);
router.get('/',             auth, ctrl.list);
router.get('/search',       auth, ctrl.search);
router.get('/:id',          auth, ctrl.getById);
router.put('/:id',          auth, ctrl.update);
router.delete('/:id',       auth, ctrl.remove);
router.post('/:id/join',    auth, ctrl.join);
router.post('/:id/approve', auth, ctrl.approve);
router.post('/:id/leave',   auth, ctrl.leave);

module.exports = router;
