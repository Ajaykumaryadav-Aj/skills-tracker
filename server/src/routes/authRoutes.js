import express from 'express'
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resendRegistrationOTP,
  resetPassword,
  verifyForgotPasswordOTP,
  verifyRegistrationOTP,
} from '../controllers/authController.js'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resendOtpValidator,
  resetPasswordValidator,
  verifyOtpValidator,
} from '../validations/authValidators.js'
import { authLimiter } from '../middlewares/rateLimiters.js'

const router = express.Router()

router.post('/register', authLimiter, registerValidator, validate, register)
router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, verifyRegistrationOTP)
router.post('/resend-otp', authLimiter, resendOtpValidator, validate, resendRegistrationOTP)
router.post('/login', authLimiter, loginValidator, validate, login)
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword)
router.post('/verify-forgot-otp', authLimiter, verifyOtpValidator, validate, verifyForgotPasswordOTP)
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, resetPassword)
router.post('/logout', auth, logout)
router.get('/me', auth, me)

export default router
