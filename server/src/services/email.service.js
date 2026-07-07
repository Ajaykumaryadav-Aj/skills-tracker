import nodemailer from 'nodemailer'
import env from '../config/env.js'
import logger from '../config/logger.js'
import otpEmailTemplate from '../templates/otpEmailTemplate.js'
import httpError from '../utils/httpError.js'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
})

const assertEmailConfigured = () => {
  if (!env.emailUser || !env.emailPass) {
    throw httpError(503, 'Email service is not configured', 'EMAIL_NOT_CONFIGURED')
  }
}

const sendMail = async ({ to, subject, html }) => {
  assertEmailConfigured()
  const info = await transporter.sendMail({
    from: `"Skills Tracker" <${env.emailUser}>`,
    to,
    subject,
    html,
  })
  logger.info({ messageId: info.messageId, to }, 'Email sent')
  return info
}

export const sendOTPEmail = ({ to, name, otp }) =>
  sendMail({
    to,
    subject: 'Verify your Skills Tracker email',
    html: otpEmailTemplate({ name, otp, purpose: 'verify your email' }),
  })

export const sendForgotPasswordEmail = ({ to, name, otp }) =>
  sendMail({
    to,
    subject: 'Reset your Skills Tracker password',
    html: otpEmailTemplate({ name, otp, purpose: 'reset your password' }),
  })
