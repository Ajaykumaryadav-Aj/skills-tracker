import mongoose from 'mongoose'
import net from 'net'
import app from './app.js'
import connectDB from './config/db.js'
import env from './config/env.js'
import logger from './config/logger.js'

let server
let shuttingDown = false

const shutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Graceful shutdown started')

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out')
    process.exit(1)
  }, 10000)
  forceExit.unref()

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await mongoose.disconnect()
  clearTimeout(forceExit)
  logger.info('Graceful shutdown complete')
}

const checkPortAvailable = (port) =>
  new Promise((resolve, reject) => {
    const tester = net.createServer()
    tester.once('error', (error) => {
      if (error.code === 'EADDRINUSE') return resolve(false)
      return reject(error)
    })
    tester.once('listening', () => {
      tester.close(() => resolve(true))
    })
    tester.listen(port)
  })

const existingApiIsHealthy = async (port) => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) })
    return response.ok
  } catch {
    return false
  }
}

const listen = (port) =>
  new Promise((resolve, reject) => {
    const instance = app.listen(port)
    instance.once('listening', () => resolve(instance))
    instance.once('error', reject)
  })

const startServer = async () => {
  const portAvailable = await checkPortAvailable(env.port)
  if (!portAvailable) {
    const sameApiRunning = await existingApiIsHealthy(env.port)
    if (sameApiRunning) {
      logger.warn(
        { port: env.port },
        'API server is already running on this port. Reusing the existing process; no new server started.'
      )
      return
    }

    const error = new Error(`Port ${env.port} is already in use by another process`)
    error.code = 'EADDRINUSE'
    error.port = env.port
    throw error
  }

  await connectDB()
  server = await listen(env.port)
  logger.info({ port: env.port }, 'API server listening')
  server.keepAliveTimeout = 65000
  server.headersTimeout = 200000
  server.requestTimeout = 180000   // 3 min — allows AI roadmap generation to complete
}

if (env.nodeEnv !== 'test') {
  startServer().catch((error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(
        { port: error.port || env.port },
        'Unable to start API server because the port is already in use. Stop the existing process or change PORT in .env.'
      )
    } else {
      logger.fatal({ err: error }, 'Unable to start API server')
    }
    process.exit(1)
  })

  process.on('SIGTERM', () => shutdown('SIGTERM').then(() => process.exit(0)))
  process.on('SIGINT', () => shutdown('SIGINT').then(() => process.exit(0)))
  process.on('unhandledRejection', (error) => logger.error({ err: error }, 'Unhandled rejection'))
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception')
    shutdown('uncaughtException').finally(() => process.exit(1))
  })
}
