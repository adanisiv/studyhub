const router = require('express').Router();
const ctrl = require('../controllers/postController');
const auth = require('../middleware/auth');

router.post('/',               auth, ctrl.create);
router.get('/feed',            auth, ctrl.feed);
router.get('/my',              auth, ctrl.myPosts);
router.get('/search',          auth, ctrl.search);
router.get('/group/:groupId',  auth, ctrl.byGroup);
router.get('/:id',             auth, ctrl.getById);
router.put('/:id',             auth, ctrl.update);
router.delete('/:id',          auth, ctrl.remove);
router.post('/:id/comment',    auth, ctrl.addComment);
router.post('/:id/like',       auth, ctrl.toggleLike);

module.exports = router;
