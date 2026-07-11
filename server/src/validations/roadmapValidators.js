import { body, param } from 'express-validator'

export const createRoadmapValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be 1000 characters or less'),
  body('category')
    .optional()
    .isIn(['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data Science', 'Other'])
    .withMessage('Invalid category'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('targetDate').optional().isISO8601().withMessage('Invalid target date'),
]

export const updateRoadmapValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be 1000 characters or less'),
  body('category')
    .optional()
    .isIn(['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data Science', 'Other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['Not Started', 'In Progress', 'Completed'])
    .withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('targetDate').optional().isISO8601().withMessage('Invalid target date'),
]

export const importTemplateValidator = [
  param('templateId').isMongoId().withMessage('Invalid template ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
]

export const addSkillToRoadmapValidator = [
  param('roadmapId').isMongoId().withMessage('Invalid roadmap ID'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be 1000 characters or less'),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level'),
  body('estimatedHours').optional().isInt({ min: 1 }).withMessage('Estimated hours must be a positive number'),
]

export const updateRoadmapSkillValidator = [
  param('roadmapId').isMongoId().withMessage('Invalid roadmap ID'),
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('status')
    .optional()
    .isIn(['Not Started', 'In progress', 'Completed'])
    .withMessage('Invalid status'),
]

export const addTopicToRoadmapSkillValidator = [
  param('roadmapId').isMongoId().withMessage('Invalid roadmap ID'),
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be 200 characters or less'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or less'),
]
