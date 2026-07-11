import { body, query } from 'express-validator'

export const revisionFilterValidator = [
  query('skillId').optional({ checkFalsy: true }).isMongoId().withMessage('Skill must be valid'),
  query('topicId').optional({ checkFalsy: true }).isMongoId().withMessage('Topic must be valid'),
  query('status').optional({ checkFalsy: true }).isIn(['Upcoming', 'Due Today', 'Completed', 'Missed', 'Snoozed']).withMessage('Status is invalid'),
  query('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('End date must be valid'),
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Search must be 100 characters or less'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]

export const generateRevisionValidator = [
  body('skillId').optional({ checkFalsy: true }).isMongoId().withMessage('Skill must be valid'),
  body('baseDate').optional({ checkFalsy: true }).isISO8601().withMessage('Base date must be valid'),
]

export const snoozeRevisionValidator = [
  body('snoozeUntil')
    .exists({ checkFalsy: true })
    .withMessage('Snooze date is required')
    .isISO8601()
    .withMessage('Snooze date must be valid')
    .custom((value) => {
      const selected = new Date(value)
      const now = new Date()
      if (selected <= now) throw new Error('Snooze date must be in the future')
      return true
    }),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }).withMessage('Notes must be 5000 characters or less'),
]

export const revisionNotesValidator = [
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }).withMessage('Notes must be 5000 characters or less'),
]
