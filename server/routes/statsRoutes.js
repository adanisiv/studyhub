const router = require('express').Router();
const ctrl = require('../controllers/statsController');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// Reject malformed :userId early (→ 400) before it reaches the aggregation.
router.param('userId', validateObjectId);

router.get('/dashboard',       auth, ctrl.dashboard);      // GET /api/stats/dashboard       — 4 summary counts
router.get('/trending',        auth, ctrl.trending);       // GET /api/stats/trending        — trending tags + top groups
router.get('/posts-per-month', auth, ctrl.postsPerMonth);  // GET /api/stats/posts-per-month — data for bar chart
router.get('/post-types',      auth, ctrl.postTypes);      // GET /api/stats/post-types      — data for pie chart
router.get('/daily-activity',  auth, ctrl.dailyActivity);  // GET /api/stats/daily-activity  — data for line chart
router.get('/user/:userId',          auth, ctrl.userStats);    // GET /api/stats/user/:userId           — personal stats
router.get('/user/:userId/activity', auth, ctrl.userActivity); // GET /api/stats/user/:userId/activity — recent likes/comments

module.exports = router;
