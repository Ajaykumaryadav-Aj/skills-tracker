import { randomUUID } from 'crypto'
import pino from 'pino'
import pinoHttp from 'pino-http'
import env from './env.js'

const logger = pino({
  level: env.logLevel,
  base: {
    service: 'skills-tracker-api',
    environment: env.nodeEnv,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'request.headers.authorization',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
})

export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const requestId = req.headers['x-request-id'] || randomUUID()
    res.setHeader('X-Request-Id', requestId)
    return requestId
  },
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      }
    },
    res(res) {
      return { statusCode: res.statusCode }
    },
  },
})

export default logger
