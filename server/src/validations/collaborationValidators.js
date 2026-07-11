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

export const teamCreateValidator = [
  body('name').trim().notEmpty().withMessage('Team name is required').isLength({ max: 120 }).withMessage('Team name is too long'),
  body('description').optional().trim().isLength({ max: 400 }).withMessage('Description is too long'),
]

export const teamInviteValidator = [
  objectId('teamId'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
]

export const joinTeamValidator = [body('inviteCode').trim().notEmpty().withMessage('Invite code is required')]
export const memberValidator = [objectId('teamId'), objectId('memberId')]
export const teamIdValidator = [objectId('teamId')]

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
export const notificationListValidator = [...pagination, query('unread').optional().isBoolean()]
export const notificationIdValidator = [objectId('id')]

export const reminderCreateValidator = [
  body('title').trim().notEmpty().withMessage('Reminder title is required').isLength({ max: 160 }).withMessage('Reminder title is too long'),
  body('date').isISO8601().withMessage('Reminder date is required'),
  body('time').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Use HH:mm time'),
  body('repeat').optional().isIn(['none', 'daily', 'weekly', 'monthly']).withMessage('Invalid repeat'),
]

export const reminderUpdateValidator = [
  objectId('id'),
  body('title').optional().trim().notEmpty().isLength({ max: 160 }),
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('repeat').optional().isIn(['none', 'daily', 'weekly', 'monthly']),
  body('completedAt').optional({ nullable: true }).isISO8601(),
]

export const reminderIdValidator = [objectId('id')]
