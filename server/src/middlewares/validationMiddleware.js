import { validationResult } from 'express-validator'

export default function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      requestId: req.id,
      errors: errors.array({ onlyFirstError: true }).map((error) => ({
        field: error.path,
        location: error.location,
        message: error.msg,
      })),
    })
  }
  next()
}
