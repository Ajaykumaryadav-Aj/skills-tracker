import jwt from 'jsonwebtoken'
import Token from '../models/Token.js'
import env from '../config/env.js'
import logger from '../config/logger.js'
import { hashToken } from '../utils/token.js'
import User from '../models/User.js'

export default async function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
      requestId: req.id,
      errors: [],
    })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.jwtSecret)

    // Check token blacklist (revoked tokens after logout)
    const revoked = await Token.exists({ tokenHash: hashToken(token) })
    if (revoked) {
      logger.warn({ requestId: req.id, userId: decoded?.id }, 'Revoked token used')
      return res.status(401).json({ success: false, message: 'Token has been revoked', code: 'TOKEN_REVOKED', requestId: req.id, errors: [] })
    }

    req.user = decoded
    User.updateOne({ _id: decoded.id }, { $set: { lastActive: new Date() } }).catch(() => null)
    next()
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError'
    logger.warn({ requestId: req.id, errName: err.name }, 'JWT validation failed')
    res.status(401).json({
      success: false,
      message: isExpired ? 'Token has expired, please log in again' : 'Invalid or expired token',
      code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      requestId: req.id,
      errors: [],
    })
  }
}
