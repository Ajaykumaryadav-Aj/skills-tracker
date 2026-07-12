import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import env from './config/env.js'
import { requestLogger } from './config/logger.js'
import { invalidateCacheOnMutation } from './middlewares/cacheMiddleware.js'
import errorHandler from './middlewares/errorMiddleware.js'
import notFound from './middlewares/notFoundMiddleware.js'
import { apiLimiter } from './middlewares/rateLimiters.js'
import rejectUnsafeRequestKeys from './middlewares/requestSecurity.js'
import xssSanitizer from './middlewares/xssMiddleware.js'
import routes from './routes/index.js'
import { swaggerUi, specs } from './config/swagger.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.disable('x-powered-by')
app.set('etag', 'strong')
if (env.trustProxy) app.set('trust proxy', 1)

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true)
    const error = new Error('Origin is not allowed')
    error.status = 403
    error.code = 'CORS_FORBIDDEN'
    return callback(error)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'X-Request-Id', 'X-Cache'],
  maxAge: 86400,
}

app.use(requestLogger)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      connectSrc: ["'self'", "*"],
    }
  }
}))
app.use(cors(corsOptions))
app.use(compression({ threshold: 1024 }))
app.use(express.json({ limit: env.jsonLimit, strict: true }))
app.use(express.urlencoded({ extended: false, limit: env.jsonLimit }))
app.use(rejectUnsafeRequestKeys)
app.use(xssSanitizer)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  fallthrough: false,
  immutable: true,
  maxAge: '7d',
}))

app.get('/', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1
  res.json({
    success: true,
    message: 'Welcome to the Skills Tracker API Service.',
    status: databaseReady ? 'online' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected',
    documentation: '/api-docs',
    timestamp: new Date()
  })
})

app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
    requestId: req.id,
  })
})

app.get('/readiness', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1
  if (databaseReady) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date()
    })
  } else {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date()
    })
  }
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

app.use('/api', apiLimiter, invalidateCacheOnMutation, routes)
app.use(notFound)
app.use(errorHandler)

export default app
