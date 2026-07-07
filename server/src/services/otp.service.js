import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import OTP from '../models/OTP.js'
import { OTP_CONFIG } from '../constants/auth.constants.js'
import httpError from '../utils/httpError.js'

export const generateOTP = () => String(crypto.randomInt(100000, 1000000))

export const hashOTP = (otp) => bcrypt.hash(String(otp), 10)

export const verifyOTP = async ({ userId, purpose, otp, consume = false }) => {
  const record = await OTP.findOne({ userId, purpose }).select('+otpHash')
  if (!record) throw httpError(400, 'Invalid or expired OTP', 'OTP_INVALID')

  if (record.expiresAt.getTime() <= Date.now()) {
    await OTP.deleteOne({ _id: record._id })
    throw httpError(400, 'OTP has expired', 'OTP_EXPIRED')
  }

  if (record.attempts >= OTP_CONFIG.maxAttempts) {
    throw httpError(429, 'Maximum OTP attempts exceeded', 'OTP_ATTEMPTS_EXCEEDED')
  }

  const matched = await bcrypt.compare(String(otp), record.otpHash)
  if (!matched) {
    record.attempts += 1
    await record.save()
    throw httpError(400, 'Invalid OTP', 'OTP_INVALID')
  }

  if (consume) {
    await OTP.deleteOne({ _id: record._id })
    return record
  }

  record.verifiedAt = new Date()
  await record.save()
  return record
}

export const createOTP = async ({ userId, purpose, resendCount = 0, windowStartedAt } = {}) => {
  const otp = generateOTP()
  const otpHash = await hashOTP(otp)
  const now = new Date()

  await OTP.deleteMany({ userId, purpose })
  await OTP.create({
    userId,
    otpHash,
    purpose,
    attempts: 0,
    resendCount,
    lastSentAt: now,
    windowStartedAt: windowStartedAt || now,
    expiresAt: new Date(now.getTime() + OTP_CONFIG.expiresInMs),
  })

  return otp
}

export const resendOTP = async ({ userId, purpose }) => {
  const now = new Date()
  const existing = await OTP.findOne({ userId, purpose }).select('+otpHash')

  if (!existing) return createOTP({ userId, purpose })

  if (now.getTime() - existing.lastSentAt.getTime() < OTP_CONFIG.resendCooldownMs) {
    throw httpError(429, 'Please wait 30 seconds before requesting another OTP', 'OTP_RESEND_COOLDOWN')
  }

  const windowExpired = now.getTime() - existing.windowStartedAt.getTime() >= OTP_CONFIG.resendWindowMs
  const resendCount = windowExpired ? 0 : existing.resendCount

  if (resendCount >= OTP_CONFIG.maxResendsPerWindow) {
    throw httpError(429, 'Maximum resend requests reached. Try again later.', 'OTP_RESEND_LIMIT')
  }

  return createOTP({
    userId,
    purpose,
    resendCount: resendCount + 1,
    windowStartedAt: windowExpired ? now : existing.windowStartedAt,
  })
}

export const assertForgotOTPVerified = async ({ userId }) => {
  const record = await OTP.findOne({ userId, purpose: 'forgot-password' })
  if (!record || !record.verifiedAt) {
    throw httpError(400, 'Forgot password OTP has not been verified', 'OTP_NOT_VERIFIED')
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await OTP.deleteOne({ _id: record._id })
    throw httpError(400, 'OTP has expired', 'OTP_EXPIRED')
  }

  return record
}
