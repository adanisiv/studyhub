const router = require('express').Router();
const ctrl = require('../controllers/statsController');
const auth = require('../middleware/auth');

router.get('/posts-per-month', auth, ctrl.postsPerMonth);
router.get('/post-types',      auth, ctrl.postTypes);

module.exports = router;
