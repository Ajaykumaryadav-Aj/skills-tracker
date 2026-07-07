import { body, param } from 'express-validator'
import { isRichTextBlank, sanitizeRichText } from '../utils/richText.js'

const validateNoteContent = (value) => {
  if (isRichTextBlank(sanitizeRichText(value))) {
    throw new Error('Note content is required')
  }
  return true
}

const urlOptions = {
  protocols: ['http', 'https'],
  require_protocol: true,
}

export const addNoteValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  body('content')
    .isString()
    .withMessage('Note content is required')
    .bail()
    .isLength({ max: 10000 })
    .withMessage('Note must be 10000 characters or less')
    .bail()
    .custom(validateNoteContent),
]

export const updateNoteValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  body('content')
    .isString()
    .withMessage('Note content cannot be empty')
    .bail()
    .isLength({ max: 10000 })
    .withMessage('Note must be 10000 characters or less')
    .bail()
    .custom(validateNoteContent),
]

export const deleteNoteValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
]

export const addResourceValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Resource title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be 200 characters or less'),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .bail()
    .isURL(urlOptions)
    .withMessage('URL must be a valid http or https URL'),
  body('type')
    .optional()
    .isIn(['article', 'video', 'course', 'documentation', 'tutorial', 'other'])
    .withMessage('Invalid resource type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
]

export const updateResourceValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  param('resourceId').isMongoId().withMessage('Invalid resource ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must be 200 characters or less'),
  body('url')
    .optional()
    .trim()
    .isURL(urlOptions)
    .withMessage('URL must be a valid http or https URL'),
  body('type')
    .optional()
    .isIn(['article', 'video', 'course', 'documentation', 'tutorial', 'other'])
    .withMessage('Invalid resource type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  body('favorite').optional().isBoolean().withMessage('Favorite must be a boolean').toBoolean(),
]

export const deleteResourceValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  param('resourceId').isMongoId().withMessage('Invalid resource ID'),
]

export const toggleResourceFavoriteValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  param('resourceId').isMongoId().withMessage('Invalid resource ID'),
]

export const noteParamsValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
]

export const resourceParamsValidator = [
  ...noteParamsValidator,
  param('resourceId').isMongoId().withMessage('Invalid resource ID'),
]
