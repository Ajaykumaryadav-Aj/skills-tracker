import { body } from 'express-validator'
import { TOPIC_PRIORITIES, TOPIC_STATUSES } from '../models/Topic.js'

const isTodayOrFuture = (value) => {
  if (!value) return true
  const date = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

const isEmptyOrNonNegative = (value) => value === '' || Number(value) >= 0

export const createTopicValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('status').optional().isIn(TOPIC_STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(TOPIC_PRIORITIES).withMessage('Invalid priority'),
  body('estimatedHours').optional({ nullable: true }).custom(isEmptyOrNonNegative).withMessage('Estimated hours must be 0 or greater'),
  body('actualHours').optional({ nullable: true }).custom(isEmptyOrNonNegative).withMessage('Actual hours must be 0 or greater'),
  body('order').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Order must be 0 or greater'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be valid')
    .bail()
    .custom(isTodayOrFuture)
    .withMessage('Due date cannot be before today'),
]

export const updateTopicValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('status').optional().isIn(TOPIC_STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(TOPIC_PRIORITIES).withMessage('Invalid priority'),
  body('estimatedHours').optional({ nullable: true }).custom(isEmptyOrNonNegative).withMessage('Estimated hours must be 0 or greater'),
  body('actualHours').optional({ nullable: true }).custom(isEmptyOrNonNegative).withMessage('Actual hours must be 0 or greater'),
  body('order').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Order must be 0 or greater'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be valid')
    .bail()
    .custom(isTodayOrFuture)
    .withMessage('Due date cannot be before today'),
]

export const reorderTopicsValidator = [
  body('topicIds').isArray({ min: 1 }).withMessage('topicIds must be a non-empty array'),
  body('topicIds.*').isMongoId().withMessage('Each topic ID must be valid'),
]

export default {}
