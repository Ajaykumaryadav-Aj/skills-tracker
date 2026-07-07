import { param } from 'express-validator'

export const mongoIdParam = (name, label = 'ID') =>
  param(name).isMongoId().withMessage(`${label} must be a valid MongoDB identifier`)

export const safeNameParam = (name, label = 'Name') =>
  param(name)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .isLength({ max: 100 })
    .withMessage(`${label} must be 100 characters or less`)
