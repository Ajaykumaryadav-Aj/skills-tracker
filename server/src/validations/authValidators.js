import { body } from 'express-validator'
import { PASSWORD_REGEX } from '../constants/auth.constants.js'

const emailValidator = () =>
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .isLength({ max: 254 })
    .withMessage('Email is too long')

const passwordValidator = () =>
  body('password')
    .matches(PASSWORD_REGEX)
    .withMessage('Password must be 8-128 characters and include uppercase, lowercase, number, and special character')

const otpValidator = () =>
  body('otp')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be a 6-digit number')

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be 100 characters or less'),
  emailValidator(),
  passwordValidator(),
]

export const loginValidator = [
  emailValidator(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),
]

export const verifyOtpValidator = [
  emailValidator(),
  otpValidator(),
]

export const resendOtpValidator = [
  emailValidator(),
  body('purpose')
    .optional()
    .isIn(['register', 'forgot-password'])
    .withMessage('Purpose must be register or forgot-password'),
]

export const forgotPasswordValidator = [
  emailValidator(),
]

export const resetPasswordValidator = [
  emailValidator(),
  passwordValidator(),
]
