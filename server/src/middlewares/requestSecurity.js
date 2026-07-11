const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor'])

const hasUnsafeKey = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)

  return Object.keys(value).some((key) => {
    if (unsafeKeys.has(key) || key.startsWith('$') || key.includes('.')) return true
    return hasUnsafeKey(value[key], seen)
  })
}

export default function rejectUnsafeRequestKeys(req, res, next) {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Request contains unsupported field names',
      code: 'INVALID_REQUEST',
      requestId: req.id,
      errors: [],
    })
  }

  next()
}
