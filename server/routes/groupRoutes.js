const router = require('express').Router();
const ctrl = require('../controllers/groupController');
const auth = require('../middleware/auth');
const { createGroupRules } = require('../middleware/validate'); // validates group name, year, semester

router.post('/',            auth, createGroupRules, ctrl.create);  // POST   /api/groups       — create group
router.get('/',             auth, ctrl.list);                      // GET    /api/groups       — list groups
router.get('/search',       auth, ctrl.search);                    // GET    /api/groups/search — search
router.get('/:id',          auth, ctrl.getById);                   // GET    /api/groups/:id   — get detail
router.put('/:id',          auth, ctrl.update);                    // PUT    /api/groups/:id   — update (admin)
router.delete('/:id',       auth, ctrl.remove);                    // DELETE /api/groups/:id  — delete (admin)
router.post('/:id/join',    auth, ctrl.join);                      // POST   /api/groups/:id/join    — join
router.post('/:id/approve', auth, ctrl.approve);                   // POST   /api/groups/:id/approve — approve
router.post('/:id/leave',   auth, ctrl.leave);                     // POST   /api/groups/:id/leave   — leave

module.exports = router;
