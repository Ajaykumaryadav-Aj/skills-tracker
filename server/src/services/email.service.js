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

const sendViaResend = async ({ to, subject, html }) => {
  const senderEmail = env.emailFrom || 'onboarding@resend.dev'
  logger.info({ to, subject, senderEmail }, 'Attempting to send email via Resend API')
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Skills Tracker <${senderEmail}>`,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend API failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  logger.info({ messageId: data.id, to }, 'Email sent successfully via Resend API')
  return data
}

const sendViaBrevo = async ({ to, subject, html }) => {
  const senderEmail = env.emailFrom || env.emailUser || 'noreply@skills-tracker.com'
  logger.info({ to, subject, senderEmail }, 'Attempting to send email via Brevo API')
  
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': env.brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Skills Tracker',
        email: senderEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brevo API failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  logger.info({ messageId: data.messageId, to }, 'Email sent successfully via Brevo API')
  return data
}

const sendViaSMTP = async ({ to, subject, html }) => {
  if (!env.emailUser || !env.emailPass) {
    throw new Error('SMTP credentials are not configured')
  }
  const info = await transporter.sendMail({
    from: `"Skills Tracker" <${env.emailFrom || env.emailUser}>`,
    to,
    subject,
    html,
  })
  logger.info({ messageId: info.messageId, to }, 'Email sent successfully via SMTP')
  return info
}

/**
 * Core send helper.
 * Automatically selects the appropriate email provider based on configuration.
 * Falls back to console log print if everything fails.
 */
const sendMail = async ({ to, subject, html, debugOtp = null }) => {
  try {
    if (env.resendApiKey) {
      return await sendViaResend({ to, subject, html })
    }
    if (env.brevoApiKey) {
      return await sendViaBrevo({ to, subject, html })
    }
    
    // Default fallback to standard SMTP
    return await sendViaSMTP({ to, subject, html })
  } catch (error) {
    logger.error({ err: error.message, to, subject }, 'Email sending failed')

    // Always log OTP for fallback retrieval
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


