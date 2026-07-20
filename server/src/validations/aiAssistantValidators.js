import { body, query } from 'express-validator'
import { AI_HISTORY_TYPES } from '../models/AIHistory.js'

const textField = (field, label, max = 500) =>
  body(field).trim().notEmpty().withMessage(`${label} is required`).isLength({ max }).withMessage(`${label} is too long`)

export const chatValidator = [
  textField('message', 'Message', 2000),
  body('history').optional().isArray().withMessage('History must be an array'),
]

export const debugValidator = [
  textField('code', 'Code', 10000),
  body('language').optional().trim().isLength({ max: 80 }),
]

export const notesValidator = [
  textField('topic', 'Topic'),
  body('type').isIn(['Detailed Notes', 'Revision Notes', 'Concise Summary']).withMessage('Invalid notes type'),
  body('level').isIn(['Simple Language (ELIF5)', 'Technical / Academic']).withMessage('Invalid language level'),
]

export const resourcesValidator = [
  textField('topic', 'Topic'),
]

export const notesSummaryValidator = [
  body('markdown')
    .customSanitizer((value, { req }) => value ?? req.body.content ?? req.body.notes ?? req.body.text ?? '')
    .trim()
    .isLength({ min: 3, max: 20000 })
    .withMessage('Notes must be between 3 and 20000 characters'),
]

export const plannerValidator = [
  textField('skill', 'Skill'),
  body('dailyStudyHours').isFloat({ min: 0.25, max: 12 }).withMessage('Daily study hours must be between 0.25 and 12'),
  body('weeklyGoal').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Weekly goal is too long'),
]

export const interviewValidator = [
  textField('topic', 'Topic'),
  body('type').optional().isIn(['Technical', 'HR', 'Follow-up']).withMessage('Question type is invalid'),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Difficulty is invalid'),
]

export const aiHistoryValidator = [
  query('type').optional({ checkFalsy: true }).isIn(AI_HISTORY_TYPES).withMessage('AI history type is invalid'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]
