import jwt from 'jsonwebtoken'
import Token from '../models/Token.js'
import env from '../config/env.js'
import { hashToken } from '../utils/token.js'

export default async function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized', errors: [] })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.jwtSecret)
    const black = await Token.exists({
      $or: [{ tokenHash: hashToken(token) }, { token }],
    })
    if (black) return res.status(401).json({ success: false, message: 'Token revoked', errors: [] })

    req.user = decoded
    next()
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      requestId: req.id,
      errors: [],
    })
  }
}
