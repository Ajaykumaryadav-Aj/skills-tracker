import { body, param, query } from 'express-validator'
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
    .optional({ checkFalsy: true })
    .trim()
    .bail()
    .isURL(urlOptions)
    .withMessage('URL must be a valid http or https URL'),
  body('type')
    .optional()
    .isIn(['YouTube', 'Documentation', 'GitHub', 'Website', 'PDF', 'Course', 'article', 'video', 'course', 'documentation', 'tutorial', 'other'])
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
    .isIn(['YouTube', 'Documentation', 'GitHub', 'Website', 'PDF', 'Course', 'article', 'video', 'course', 'documentation', 'tutorial', 'other'])
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

export const listKnowledgeValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Search must be 120 characters or less'),
  query('tag').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Tag must be 40 characters or less'),
  query('type').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Type must be 40 characters or less'),
  query('sort').optional({ checkFalsy: true }).isIn(['updated-desc', 'updated-asc', 'created-desc', 'created-asc', 'title-asc', 'title-desc']).withMessage('Invalid sort option'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]

export const createNoteItemValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  body('title').trim().notEmpty().withMessage('Note title is required').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('content').trim().notEmpty().withMessage('Note content is required').isLength({ max: 30000 }).withMessage('Note must be 30000 characters or less'),
  body('tags').optional().customSanitizer((value) => Array.isArray(value) ? value : String(value || '').split(',')).isArray({ max: 12 }).withMessage('Up to 12 tags are allowed'),
  body('pinned').optional().isBoolean().withMessage('Pinned must be a boolean').toBoolean(),
  body('favorite').optional().isBoolean().withMessage('Favorite must be a boolean').toBoolean(),
]

export const updateNoteItemValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  param('noteId').isMongoId().withMessage('Invalid note ID'),
  body('title').optional().trim().notEmpty().withMessage('Note title is required').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('content').optional().trim().notEmpty().withMessage('Note content is required').isLength({ max: 30000 }).withMessage('Note must be 30000 characters or less'),
  body('tags').optional().customSanitizer((value) => Array.isArray(value) ? value : String(value || '').split(',')).isArray({ max: 12 }).withMessage('Up to 12 tags are allowed'),
  body('pinned').optional().isBoolean().withMessage('Pinned must be a boolean').toBoolean(),
  body('favorite').optional().isBoolean().withMessage('Favorite must be a boolean').toBoolean(),
]

export const noteItemParamsValidator = [
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  param('topicId').isMongoId().withMessage('Invalid topic ID'),
  param('noteId').isMongoId().withMessage('Invalid note ID'),
]

export const globalKnowledgeSearchValidator = [
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Search must be 120 characters or less'),
]
