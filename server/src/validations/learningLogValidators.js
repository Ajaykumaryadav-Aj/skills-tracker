import { body, param, query } from 'express-validator'

export const createLogValidator = [
  body('skillId').isMongoId().withMessage('Skill must be valid'),
  body('topicId').isMongoId().withMessage('Topic must be valid'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('Notes must be 2000 characters or less'),
]

export const updateLogValidator = [
  param('id').isMongoId().withMessage('Learning log ID must be valid'),
  body('skillId').optional().isMongoId().withMessage('Skill must be valid'),
  body('topicId').optional().isMongoId().withMessage('Topic must be valid'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('Notes must be 2000 characters or less'),
]

export const historyFilterValidator = [
  query('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('endDate must be a valid date'),
  query('skillId').optional({ checkFalsy: true }).isMongoId().withMessage('skillId must be valid'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('page must be a positive number'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
]
