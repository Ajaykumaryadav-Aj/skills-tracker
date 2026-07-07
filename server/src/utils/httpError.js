export default function httpError(status, message, code, details) {
  const error = new Error(message)
  error.status = status
  if (code) error.code = code
  if (details) error.details = details
  return error
}
