import logger from '../config/logger.js'
import env from '../config/env.js'

const normalizeError = (err) => {
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body contains invalid JSON' }
  }

  if (err.name === 'ValidationError') {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: Object.values(err.errors).map((error) => error.message).join(', '),
    }
  }

  if (err.name === 'CastError') {
    return { status: 400, code: 'INVALID_IDENTIFIER', message: 'Invalid resource identifier' }
  }

  if (err.code === 11000) {
    return { status: 409, code: 'DUPLICATE_RESOURCE', message: 'A resource with these details already exists' }
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Avatar must be 2MB or smaller'
      : err.message
    return { status: 400, code: err.code || 'UPLOAD_ERROR', message }
  }

  if (['JsonWebTokenError', 'TokenExpiredError'].includes(err.name)) {
    return { status: 401, code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
  }

  return {
    status: err.status || err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  }
}

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  const normalized = normalizeError(err)
  const log = req.log || logger
  const logPayload = {
    err,
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode: normalized.status,
  }

  if (normalized.status >= 500) log.error(logPayload, 'Request failed')
  else log.warn(logPayload, 'Request rejected')

  const payload = {
    success: false,
    message: normalized.status >= 500 && env.isProduction
      ? 'Internal server error'
      : normalized.message,
    code: normalized.code,
    requestId: req.id,
    errors: err.details || [],
  }

  res.status(normalized.status).json(payload)
}
