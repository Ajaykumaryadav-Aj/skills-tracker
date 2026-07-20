import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from '../config/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logsDir = path.join(__dirname, '..', '..', 'logs')

// Ensure logs directory exists
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
} catch (err) {
  console.error('Failed to create logs directory:', err)
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const rotateLogFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return
    const stats = fs.statSync(filePath)
    if (stats.size < MAX_FILE_SIZE) return

    // Rotate: .log -> .log.1 -> .log.2 -> .log.3
    const maxBackups = 3
    for (let i = maxBackups - 1; i >= 1; i--) {
      const oldPath = `${filePath}.${i}`
      const newPath = `${filePath}.${i + 1}`
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath)
      }
    }
    fs.renameSync(filePath, `${filePath}.1`)
  } catch (err) {
    console.error('Failed to rotate log file:', err)
  }
}

export const logToFile = (category, level, message, metadata = {}) => {
  try {
    const filePath = path.join(logsDir, `${category}.log`)
    rotateLogFile(filePath)

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    }

    fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf8')

    // Also forward to standard logger (Pino) for unified logs
    if (level === 'error') {
      logger.error({ category, ...metadata }, message)
    } else if (level === 'warn') {
      logger.warn({ category, ...metadata }, message)
    } else {
      logger.info({ category, ...metadata }, message)
    }
  } catch (err) {
    console.error(`Failed to write to log file for category ${category}:`, err)
  }
}
