import AuditLog from '../models/AuditLog.js'

export const logAuditEvent = async (req, userId, action, metadata = {}) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : ''
    const userAgent = req ? (req.headers['user-agent'] || '') : ''
    
    await AuditLog.create({
      userId: userId || null,
      action,
      ip,
      userAgent,
      metadata,
    })
  } catch (err) {
    console.error('Failed to save audit log:', err)
  }
}
