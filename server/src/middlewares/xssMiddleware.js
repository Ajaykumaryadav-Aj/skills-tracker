const escapeHtml = (str) => {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

const IGNORED_KEYS = new Set([
  'password',
  'passwordconfirm',
  'currentpassword',
  'newpassword',
  'token',
  'refreshtoken',
  'otp',
  'url',
  'avatar',
  'avatarurl',
  'website',
  'github',
  'linkedin',
  'link',
  'image',
  'imageurl',
  'picture'
])

const shouldIgnoreKey = (key) => {
  if (!key) return false
  const lower = key.toLowerCase()
  if (IGNORED_KEYS.has(lower)) return true
  if (lower.includes('password')) return true
  if (lower.includes('token')) return true
  if (lower.includes('url')) return true
  if (lower.includes('link')) return true
  return false
}

const sanitizeValue = (value, key = null, seen = new WeakSet()) => {
  if (!value) return value
  
  if (key && shouldIgnoreKey(key)) {
    return value
  }

  if (typeof value === 'string') return escapeHtml(value)
  if (typeof value !== 'object') return value
  
  if (seen.has(value)) return value
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, key, seen))
  }

  const sanitized = {}
  for (const k of Object.keys(value)) {
    sanitized[k] = sanitizeValue(value[k], k, seen)
  }
  return sanitized
}

export default function xssSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) req.query = sanitizeValue(req.query)
  if (req.params) req.params = sanitizeValue(req.params)
  next()
}
