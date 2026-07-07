import User from '../models/User.js'
import { isAdminEmail } from '../utils/adminAccess.js'

export const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ success: false, message: 'Unauthorized', errors: [] })

    const user = await User.findById(req.user.id).select('name email role')
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized', errors: [] })

    const role = user.role || 'user'
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden', errors: [] })
    }

    if (role === 'admin' && !isAdminEmail(user.email)) {
      return res.status(403).json({ success: false, message: 'Forbidden', errors: [] })
    }

    req.currentUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role,
    }

    next()
  } catch (err) {
    next(err)
  }
}

export const requireAdmin = requireRole('admin')
