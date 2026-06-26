const router = require('express').Router();
const ctrl = require('../controllers/postController');
const auth = require('../middleware/auth');
const { createPostRules } = require('../middleware/validate');

router.post('/',               auth, createPostRules, ctrl.create);
router.get('/feed',            auth, ctrl.feed);
router.get('/my',              auth, ctrl.myPosts);
router.get('/search',          auth, ctrl.search);
router.get('/group/:groupId',  auth, ctrl.byGroup);
router.get('/:id',             auth, ctrl.getById);
router.put('/:id',             auth, ctrl.update);
router.delete('/:id',          auth, ctrl.remove);
router.post('/:id/comment',    auth, ctrl.addComment);
router.delete('/:postId/comment/:commentId', auth, ctrl.deleteComment);
router.post('/:id/like',       auth, ctrl.toggleLike);

module.exports = router;
