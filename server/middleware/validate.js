const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('department').optional().trim().isLength({ max: 100 }),
  handleValidation
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const createGroupRules = [
  body('name').trim().notEmpty().withMessage('Group name is required')
    .isLength({ max: 200 }).withMessage('Group name too long'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('semester').optional().isIn(['A', 'B', 'Summer']).withMessage('Invalid semester'),
  handleValidation
];

const createPostRules = [
  body('content').trim().notEmpty().withMessage('Post content is required')
    .isLength({ max: 5000 }).withMessage('Post content too long'),
  body('type').optional().isIn(['question', 'material', 'announcement']),
  body('tags').optional().isArray({ max: 10 }),
  handleValidation
];

module.exports = { registerRules, loginRules, createGroupRules, createPostRules };
