import { body, param, query } from 'express-validator'
import { SESSION_TYPES } from '../models/LearningLog.js'

const validateTimeRange = (value, { req }) => {
  if (!value || !req.body.startTime) return true
  if (new Date(value).getTime() <= new Date(req.body.startTime).getTime()) {
    throw new Error('End time must be after start time')
  }
  return true
}

const validateDurationSource = (_value, { req }) => {
  if (req.body.startTime && req.body.endTime) return true
  if (req.body.duration !== undefined && req.body.duration !== '') return true
  throw new Error('Start time and end time are required when duration is not provided')
}

export const createLogValidator = [
  body('skillId').isMongoId().withMessage('Skill must be valid'),
  body('topicId').isMongoId().withMessage('Topic must be valid'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').optional({ checkFalsy: true }).isISO8601().withMessage('Start time must be valid'),
  body('endTime').optional({ checkFalsy: true }).isISO8601().withMessage('End time must be valid').bail().custom(validateTimeRange),
  body('duration').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('sessionType').optional({ checkFalsy: true }).isIn(SESSION_TYPES).withMessage('Session type must be valid'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('Notes must be 2000 characters or less'),
  body().custom(validateDurationSource),
]

export const updateLogValidator = [
  param('id').isMongoId().withMessage('Learning log ID must be valid'),
  body('skillId').optional().isMongoId().withMessage('Skill must be valid'),
  body('topicId').optional().isMongoId().withMessage('Topic must be valid'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('startTime').optional({ checkFalsy: true }).isISO8601().withMessage('Start time must be valid'),
  body('endTime').optional({ checkFalsy: true }).isISO8601().withMessage('End time must be valid').bail().custom(validateTimeRange),
  body('duration').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('sessionType').optional({ checkFalsy: true }).isIn(SESSION_TYPES).withMessage('Session type must be valid'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('Notes must be 2000 characters or less'),
]

export const historyFilterValidator = [
  query('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('endDate must be a valid date'),
  query('skillId').optional({ checkFalsy: true }).isMongoId().withMessage('skillId must be valid'),
  query('topicId').optional({ checkFalsy: true }).isMongoId().withMessage('topicId must be valid'),
  query('sessionType').optional({ checkFalsy: true }).isIn(SESSION_TYPES).withMessage('sessionType must be valid'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('page must be a positive number'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
]

export const goalsValidator = [
  body('dailyStudyHours').optional().isFloat({ min: 0 }).withMessage('Daily goal cannot be negative'),
  body('weeklyStudyHours').optional().isFloat({ min: 0 }).withMessage('Weekly goal cannot be negative'),
  body('monthlyStudyHours').optional().isFloat({ min: 0 }).withMessage('Monthly goal cannot be negative'),
]
