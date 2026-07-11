import { body } from 'express-validator'
import { PASSWORD_REGEX } from '../constants/auth.constants.js'

const optionalUrl = (field, label) =>
  body(field)
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage(`${label} must be a valid http or https URL`)
    .isLength({ max: 300 })
    .withMessage(`${label} must be 300 characters or less`)

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be 100 characters or less'),
  body('bio').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Bio must be 500 characters or less'),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Location must be 120 characters or less'),
  body('profession').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Profession must be 120 characters or less'),
  body('experienceLevel').optional({ checkFalsy: true }).isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Experience level is invalid'),
  body('timezone').optional({ checkFalsy: true }).trim().isLength({ max: 80 }).withMessage('Timezone must be 80 characters or less'),
  body('learningGoal').optional({ checkFalsy: true }).trim().isLength({ max: 800 }).withMessage('Learning goal must be 800 characters or less'),
  optionalUrl('website', 'Website'),
  optionalUrl('github', 'GitHub'),
  optionalUrl('linkedin', 'LinkedIn'),
]

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .matches(PASSWORD_REGEX)
    .withMessage('New password must be 8-128 characters and include uppercase, lowercase, number, and special character')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from current password'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Confirm password must match new password'),
]
