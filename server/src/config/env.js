import dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || '.env' })

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'

const required = ['MONGO_URI', 'JWT_SECRET']
const missing = required.filter((key) => !process.env[key])
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)

if (isProduction && process.env.JWT_SECRET === 'change_this_secret') {
  throw new Error('JWT_SECRET must be changed before running in production')
}

if (isProduction && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production')
}

if (isProduction && !process.env.CORS_ORIGINS) {
  throw new Error('CORS_ORIGINS must be explicitly configured in production')
}

if (isProduction && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
  throw new Error('EMAIL_USER and EMAIL_PASS must be configured in production')
}

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback
  return String(value).toLowerCase() === 'true'
}

const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const env = Object.freeze({
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv === 'development',
  port: toInteger(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  mongoMaxPoolSize: toInteger(process.env.MONGO_MAX_POOL_SIZE, 20),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: origins,
  trustProxy: toBoolean(process.env.TRUST_PROXY, isProduction),
  jsonLimit: process.env.JSON_BODY_LIMIT || '100kb',
  apiRateLimitWindowMs: toInteger(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  apiRateLimitMax: toInteger(process.env.API_RATE_LIMIT_MAX, 300),
  authRateLimitMax: toInteger(process.env.AUTH_RATE_LIMIT_MAX, 10),
  cacheEnabled: toBoolean(process.env.API_CACHE_ENABLED, true),
  cacheTtlSeconds: toInteger(process.env.API_CACHE_TTL_SECONDS, 30),
  cacheMaxEntries: toInteger(process.env.API_CACHE_MAX_ENTRIES, 500),
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
})

export default env
