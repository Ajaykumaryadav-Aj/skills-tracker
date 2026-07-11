import { param, query } from 'express-validator'

export const adminUsersQueryValidator = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search is too long'),
  query('role').optional().isIn(['admin', 'user']).withMessage('Invalid role filter'),
  query('sort').optional().isIn(['latest', 'name', 'email']).withMessage('Invalid sort option'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]

export const deleteUserValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
]

