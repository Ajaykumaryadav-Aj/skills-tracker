import env from '../config/env.js'

const cache = new Map()

const pruneExpiredEntries = () => {
  const now = Date.now()
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key)
  }
}

const enforceSizeLimit = () => {
  while (cache.size >= env.cacheMaxEntries) {
    const oldestKey = cache.keys().next().value
    if (!oldestKey) break
    cache.delete(oldestKey)
  }
}

const cacheKey = (req, scope) => {
  const identity = scope === 'private' ? String(req.currentUser?.id || req.user?.id || 'anonymous') : 'public'
  return `${scope}:${identity}:${req.originalUrl}`
}

export const cacheResponse = ({ ttlSeconds = env.cacheTtlSeconds, scope = 'private' } = {}) =>
  (req, res, next) => {
    if (!env.cacheEnabled || req.method !== 'GET') return next()

    pruneExpiredEntries()
    const key = cacheKey(req, scope)
    const cached = cache.get(key)

    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('Cache-Control', scope === 'public' ? `public, max-age=${ttlSeconds}` : 'private, no-cache')
      return res.status(cached.statusCode).json(cached.body)
    }

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode === 200) {
        enforceSizeLimit()
        cache.set(key, {
          statusCode: res.statusCode,
          body,
          expiresAt: Date.now() + ttlSeconds * 1000,
        })
        res.setHeader('X-Cache', 'MISS')
        res.setHeader('Cache-Control', scope === 'public' ? `public, max-age=${ttlSeconds}` : 'private, no-cache')
      }
      return originalJson(body)
    }

    next()
  }

export const clearApiCache = () => cache.clear()

export const invalidateCacheOnMutation = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) clearApiCache()
    })
  }
  next()
}
