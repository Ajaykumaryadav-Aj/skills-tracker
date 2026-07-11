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
  try {
    assertEmailConfigured()
    const info = await transporter.sendMail({
      from: `"Skills Tracker" <${env.emailUser}>`,
      to,
      subject,
      html,
    })
    logger.info({ messageId: info.messageId, to }, 'Email sent')
    return info
  } catch (error) {
    logger.error({ err: error, to, subject }, 'Failed to send email via SMTP')
    
    // Fallback for non-production environments to allow testing and development
    if (env.nodeEnv !== 'production') {
      logger.warn('--- EMAIL FALLBACK (NON-PRODUCTION) ---')
      logger.warn(`To: ${to}`)
      logger.warn(`Subject: ${subject}`)
      
      // Attempt to extract the OTP from the email HTML template
      const otpMatch = html.match(/>(\d{6})</)
      const otp = otpMatch ? otpMatch[1] : 'N/A'
      
      logger.warn(`Generated OTP: ${otp}`)
      logger.warn('----------------------------------------')
      return { messageId: 'mock-message-id-' + Date.now() }
    }
    
    throw error
  }
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
