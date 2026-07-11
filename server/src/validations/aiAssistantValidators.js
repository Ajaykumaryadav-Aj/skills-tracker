import { body, query } from 'express-validator'
import { AI_HISTORY_TYPES } from '../models/AIHistory.js'

const textField = (field, label, max = 500) =>
  body(field).trim().notEmpty().withMessage(`${label} is required`).isLength({ max }).withMessage(`${label} is too long`)

export const roadmapValidator = [
  textField('skill', 'Skill'),
  textField('currentLevel', 'Current level', 80),
  textField('targetLevel', 'Target level', 80),
  body('dailyStudyHours').isFloat({ min: 0.25, max: 12 }).withMessage('Daily study hours must be between 0.25 and 12'),
]

export const plannerValidator = [
  body('dailyStudyHours').isFloat({ min: 0.25, max: 12 }).withMessage('Daily study hours must be between 0.25 and 12'),
  body('weeklyGoal').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Weekly goal is too long'),
  body('availability').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Availability is too long'),
]

export const notesSummaryValidator = [
  body('markdown')
    .customSanitizer((value, { req }) => value ?? req.body.content ?? req.body.notes ?? req.body.text ?? '')
    .trim()
    .isLength({ min: 3, max: 20000 })
    .withMessage('Notes must be between 3 and 20000 characters'),
]

export const quizValidator = [
  textField('topic', 'Topic'),
  body('difficulty').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Difficulty is invalid'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Question count must be between 1 and 20'),
]

export const interviewValidator = [
  textField('topic', 'Topic'),
  body('skill').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Skill is too long'),
]

export const aiHistoryValidator = [
  query('type').optional({ checkFalsy: true }).isIn(AI_HISTORY_TYPES).withMessage('AI history type is invalid'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]
