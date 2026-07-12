import nodemailer from 'nodemailer'
import env from '../config/env.js'
import logger from '../config/logger.js'
import otpEmailTemplate from '../templates/otpEmailTemplate.js'

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,   // 10 s – fail fast if SMTP port is blocked
  greetingTimeout: 8000,
  socketTimeout: 10000,
})

const assertEmailConfigured = () => {
  if (!env.emailUser || !env.emailPass) return false
  return true
}

/**
 * Core send helper.
 * Returns { emailFailed: true } instead of throwing so callers can surface a
 * debug OTP to the user when SMTP is unavailable (e.g. Render port blocks).
 */
const sendMail = async ({ to, subject, html, debugOtp = null }) => {
  if (!assertEmailConfigured()) {
    logger.warn({ to, subject }, 'Email not configured – skipping send')
    return { emailFailed: true }
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skills Tracker" <${env.emailFrom || env.emailUser}>`,
      to,
      subject,
      html,
    })
    logger.info({ messageId: info.messageId, to }, 'Email sent successfully')
    return info
  } catch (error) {
    logger.error({ err: { message: error.message, code: error.code, command: error.command }, to, subject }, 'SMTP send failed')

    // Log OTP for debugging (debug/staging envs or when SMTP port is blocked by hosting provider)
    logger.warn('--- EMAIL FALLBACK ACTIVE ---')
    logger.warn(`To: ${to}`)
    logger.warn(`Subject: ${subject}`)
    if (debugOtp) logger.warn(`OTP (debug): ${debugOtp}`)
    logger.warn('-----------------------------')

    return { emailFailed: true }
  }
}

export const sendOTPEmail = ({ to, name, otp }) =>
  sendMail({
    to,
    subject: 'Verify your Skills Tracker email',
    html: otpEmailTemplate({ name, otp, purpose: 'verify your email' }),
    debugOtp: otp,
  })

export const sendForgotPasswordEmail = ({ to, name, otp }) =>
  sendMail({
    to,
    subject: 'Reset your Skills Tracker password',
    html: otpEmailTemplate({ name, otp, purpose: 'reset your password' }),
    debugOtp: otp,
  })

