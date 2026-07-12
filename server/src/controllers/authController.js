import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Token from '../models/Token.js'
import OTP from '../models/OTP.js'
import env from '../config/env.js'
import { OTP_PURPOSES } from '../constants/auth.constants.js'
import { sendForgotPasswordEmail, sendOTPEmail } from '../services/email.service.js'
import { assertForgotOTPVerified, createOTP, resendOTP, verifyOTP } from '../services/otp.service.js'
import { getServerAssignedRole } from '../utils/adminAccess.js'
import { successResponse } from '../utils/apiResponse.js'
import httpError from '../utils/httpError.js'
import { hashToken } from '../utils/token.js'
import { logAuditEvent } from '../utils/auditLogger.js'

const createToken = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role || 'user' }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || 'user',
  emailVerified: Boolean(user.emailVerified),
  verifiedAt: user.verifiedAt,
  lastLogin: user.lastLogin,
  avatar: user.avatar,
  bio: user.bio,
  location: user.location,
  website: user.website,
  github: user.github,
  linkedin: user.linkedin,
  profession: user.profession,
  experienceLevel: user.experienceLevel,
  timezone: user.timezone,
  learningGoal: user.learningGoal,
  updatedAt: user.updatedAt,
})

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const hashPassword = (password) => bcrypt.hash(password, 10)

const issueAuthResponse = (res, user, message = 'Authenticated successfully') => {
  const token = createToken(user)
  return successResponse(res, message, { user: serializeUser(user), token })
}

export const register = async (req, res, next) => {
  try {
    const { name, password } = req.body
    const email = normalizeEmail(req.body.email)
    const existingUser = await User.findOne({ email })

    if (existingUser?.emailVerified) {
      throw httpError(409, 'Email already registered.', 'EMAIL_ALREADY_REGISTERED')
    }

    const passwordHash = await hashPassword(password)
    const user = existingUser || new User({ email })
    user.name = name
    user.password = passwordHash
    user.role = getServerAssignedRole(email)
    user.emailVerified = false
    await user.save()

    await logAuditEvent(req, user._id, 'auth-register-initiated', { email: user.email })

    const otp = existingUser
      ? await resendOTP({ userId: user._id, purpose: OTP_PURPOSES.REGISTER })
      : await createOTP({ userId: user._id, purpose: OTP_PURPOSES.REGISTER })
    const mailResult = await sendOTPEmail({ to: user.email, name: user.name, otp })

    // Never expose the OTP in the API response – it is logged server-side for debugging
    const defaultMsg = existingUser
      ? 'A new OTP has been sent to your email.'
      : 'Registration started. Please verify your email.'
    const responseMessage = mailResult?.emailFailed
      ? `${defaultMsg} (If you did not receive an email, please check server logs or contact support.)`
      : defaultMsg

    return successResponse(
      res,
      responseMessage,
      { email: user.email },
      201
    )
  } catch (err) {
    next(err)
  }
}

export const verifyRegistrationOTP = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email })
    if (!user) throw httpError(404, 'User not found', 'USER_NOT_FOUND')
    if (user.emailVerified) {
      user.lastLogin = new Date()
      await user.save()
      await logAuditEvent(req, user._id, 'auth-register-verify-already-done', { email: user.email })
      return issueAuthResponse(res, user, 'Email already verified.')
    }

    await verifyOTP({ userId: user._id, purpose: OTP_PURPOSES.REGISTER, otp: req.body.otp, consume: true })
    const now = new Date()
    user.emailVerified = true
    user.verifiedAt = user.verifiedAt || now
    user.lastLogin = now
    user.role = getServerAssignedRole(user.email)
    await user.save()

    await logAuditEvent(req, user._id, 'auth-register-completed', { email: user.email })

    return issueAuthResponse(res, user, 'Email verified successfully.')
  } catch (err) {
    next(err)
  }
}

export const resendRegistrationOTP = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const purpose = req.body.purpose || OTP_PURPOSES.REGISTER
    const user = await User.findOne({ email })
    if (!user) throw httpError(404, 'User not found', 'USER_NOT_FOUND')

    if (purpose === OTP_PURPOSES.REGISTER) {
      if (user.emailVerified) throw httpError(409, 'Email already registered.', 'EMAIL_ALREADY_REGISTERED')
      const otp = await resendOTP({ userId: user._id, purpose })
      await sendOTPEmail({ to: user.email, name: user.name, otp })
      return successResponse(res, 'A new OTP has been sent to your email.', { email: user.email, purpose })
    }

    if (!user.emailVerified) {
      throw httpError(403, 'Please verify your email before resetting your password.', 'EMAIL_NOT_VERIFIED')
    }

    const otp = await resendOTP({ userId: user._id, purpose })
    await sendForgotPasswordEmail({ to: user.email, name: user.name, otp })

    return successResponse(res, 'A new password reset OTP has been sent to your email.', { email: user.email, purpose })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      await logAuditEvent(req, null, 'auth-login-failed', { email })
      throw httpError(400, 'Invalid credentials', 'INVALID_CREDENTIALS')
    }

    const match = await bcrypt.compare(req.body.password, user.password)
    if (!match) {
      await logAuditEvent(req, user._id, 'auth-login-failed', { email: user.email })
      throw httpError(400, 'Invalid credentials', 'INVALID_CREDENTIALS')
    }

    if (!user.emailVerified) {
      throw httpError(403, 'Please verify your email before logging in.', 'EMAIL_NOT_VERIFIED')
    }

    const assignedRole = getServerAssignedRole(email)
    if ((user.role || 'user') !== assignedRole) {
      user.role = assignedRole
    }
    user.lastLogin = new Date()
    await user.save()

    await logAuditEvent(req, user._id, 'auth-login-success', { email: user.email, role: user.role })

    return issueAuthResponse(res, user, 'Logged in successfully.')
  } catch (err) {
    next(err)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email })

    let mailResult = null
    if (user?.emailVerified) {
      const existingOtp = await OTP.exists({ userId: user._id, purpose: OTP_PURPOSES.FORGOT_PASSWORD })
      const otp = existingOtp
        ? await resendOTP({ userId: user._id, purpose: OTP_PURPOSES.FORGOT_PASSWORD })
        : await createOTP({ userId: user._id, purpose: OTP_PURPOSES.FORGOT_PASSWORD })
      mailResult = await sendForgotPasswordEmail({ to: user.email, name: user.name, otp })
    }

    // Always return generic message to prevent email enumeration attacks
    return successResponse(res, 'If the email is registered, a password reset OTP has been sent.', { email })
  } catch (err) {
    next(err)
  }
}

export const verifyForgotPasswordOTP = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email })
    if (!user || !user.emailVerified) throw httpError(400, 'Invalid or expired OTP', 'OTP_INVALID')

    await verifyOTP({ userId: user._id, purpose: OTP_PURPOSES.FORGOT_PASSWORD, otp: req.body.otp })
    return successResponse(res, 'Password reset OTP verified.', { email: user.email })
  } catch (err) {
    next(err)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email })
    if (!user || !user.emailVerified) throw httpError(400, 'Unable to reset password', 'RESET_NOT_ALLOWED')

    const otpRecord = await assertForgotOTPVerified({ userId: user._id })
    user.password = await hashPassword(req.body.password)
    await Promise.all([
      user.save(),
      OTP.deleteOne({ _id: otpRecord._id }),
    ])

    await logAuditEvent(req, user._id, 'auth-password-reset', { email: user.email })

    return successResponse(res, 'Password reset successfully.', { email: user.email })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) throw httpError(400, 'No token provided', 'TOKEN_REQUIRED')

    const decoded = jwt.decode(token)
    const exp = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 1000 * 60 * 60 * 24)

    await Token.create({ tokenHash: hashToken(token), expiresAt: exp })

    if (decoded?.id) {
      await logAuditEvent(req, decoded.id, 'auth-logout', { email: decoded.email })
    }

    return successResponse(res, 'Logged out successfully.')
  } catch (err) {
    next(err)
  }
}

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) throw httpError(404, 'User not found', 'USER_NOT_FOUND')
    return successResponse(res, 'Current user fetched successfully.', { user: serializeUser(user) })
  } catch (err) {
    next(err)
  }
}
