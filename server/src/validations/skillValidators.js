import { body } from 'express-validator'

const statusOptions = ['Not Started', 'Learning', 'Completed', 'Paused', 'Not started', 'In progress']
const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced']

const isTodayOrFuture = (value) => {
  if (!value) return true
  const date = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

const isEmptyOrPositiveNumber = (value) => value === '' || Number(value) > 0

export const createSkillValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category is too long'),
  body('icon').optional({ checkFalsy: true }).trim().isLength({ max: 80 }).withMessage('Icon is too long'),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 32 }).withMessage('Color is too long'),
  body('difficulty').optional().isIn(difficultyOptions).withMessage(`Difficulty must be one of: ${difficultyOptions.join(', ')}`),
  body('targetDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Target date must be a valid date')
    .bail()
    .custom(isTodayOrFuture)
    .withMessage('Target date cannot be in the past'),
  body('targetCompletionDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Target completion date must be a valid date')
    .bail()
    .custom(isTodayOrFuture)
    .withMessage('Target completion date cannot be in the past'),
  body('estimatedHours').optional({ nullable: true }).custom(isEmptyOrPositiveNumber).withMessage('Estimated hours must be greater than 0'),
  body('status')
    .optional()
    .trim()
    .isIn(statusOptions)
    .withMessage('Status is invalid'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be a number between 0 and 100'),
  body('isFavorite').optional().isBoolean().withMessage('Favorite must be true or false'),
  body('isArchived').optional().isBoolean().withMessage('Archived must be true or false'),
]

export const updateSkillValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('category').optional().trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category is too long'),
  body('icon').optional({ checkFalsy: true }).trim().isLength({ max: 80 }).withMessage('Icon is too long'),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 32 }).withMessage('Color is too long'),
  body('difficulty').optional().isIn(difficultyOptions).withMessage(`Difficulty must be one of: ${difficultyOptions.join(', ')}`),
  body('targetDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Target date must be a valid date')
    .bail()
    .custom(isTodayOrFuture)
    .withMessage('Target date cannot be in the past'),
  body('targetCompletionDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Target completion date must be a valid date')
    .bail()
    .custom(isTodayOrFuture)
    .withMessage('Target completion date cannot be in the past'),
  body('estimatedHours').optional({ nullable: true }).custom(isEmptyOrPositiveNumber).withMessage('Estimated hours must be greater than 0'),
  body('status')
    .optional()
    .trim()
    .isIn(statusOptions)
    .withMessage('Status is invalid'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be a number between 0 and 100'),
  body('isFavorite').optional().isBoolean().withMessage('Favorite must be true or false'),
  body('isArchived').optional().isBoolean().withMessage('Archived must be true or false'),
]
