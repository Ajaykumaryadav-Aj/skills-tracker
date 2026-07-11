import { rateLimit } from 'express-rate-limit'
import env from '../config/env.js'

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMITED',
    requestId: req.id,
    errors: [],
  })
}

export const apiLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  limit: env.apiRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
})

export const authLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
})

export const changePasswordLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
})

export const aiLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  limit: env.aiRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
})

export const aiReadLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  limit: env.aiReadRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
})
