const router = require('express').Router();
const ctrl = require('../controllers/postController');
const auth = require('../middleware/auth');
const { createPostRules } = require('../middleware/validate'); // validates content, type, tags

// Post CRUD
router.post('/',               auth, createPostRules, ctrl.create);  // POST   /api/posts       — create
router.get('/feed',            auth, ctrl.feed);                     // GET    /api/posts/feed  — personalized feed
router.get('/my',              auth, ctrl.myPosts);                  // GET    /api/posts/my    — own posts
router.get('/search',          auth, ctrl.search);                   // GET    /api/posts/search — advanced search
router.get('/group/:groupId',  auth, ctrl.byGroup);                  // GET    /api/posts/group/:id — group posts
router.get('/:id',             auth, ctrl.getById);                  // GET    /api/posts/:id   — single post
router.put('/:id',             auth, ctrl.update);                   // PUT    /api/posts/:id   — edit
router.delete('/:id',          auth, ctrl.remove);                   // DELETE /api/posts/:id  — delete

// Social interactions (nested under /:id)
router.post('/:id/comment',                      auth, ctrl.addComment);     // add comment
router.delete('/:postId/comment/:commentId',     auth, ctrl.deleteComment);  // delete comment
router.post('/:id/like',                         auth, ctrl.toggleLike);     // toggle like

module.exports = router;
