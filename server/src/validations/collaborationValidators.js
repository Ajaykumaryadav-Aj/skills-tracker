import { body, param, query } from 'express-validator'

const objectId = (field) => param(field).isMongoId().withMessage(`${field} must be a valid id`)
const pagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]

export const privacyValidator = [
  body('enabled').optional().isBoolean().withMessage('enabled must be boolean'),
  body('slug').optional().trim().isLength({ min: 3, max: 80 }).withMessage('Slug must be 3-80 characters'),
  body('showLearningHours').optional().isBoolean(),
  body('showXp').optional().isBoolean(),
  body('showBadges').optional().isBoolean(),
  body('showAchievements').optional().isBoolean(),
]

export const publicSlugValidator = [param('slug').trim().isLength({ min: 3, max: 80 }).withMessage('Invalid public profile link')]

export const activityValidator = [...pagination, query('type').optional().trim()]

export const targetValidator = [
  param('targetType').isIn(['note', 'resource']).withMessage('Target type must be note or resource'),
  objectId('targetId'),
]

export const createCommentValidator = [
  ...targetValidator,
  body('body').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1200 }).withMessage('Comment is too long'),
  body('parentId').optional().isMongoId().withMessage('Parent comment must be valid'),
]

export const updateCommentValidator = [
  objectId('commentId'),
  body('body').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1200 }).withMessage('Comment is too long'),
]

export const commentIdValidator = [objectId('commentId')]
