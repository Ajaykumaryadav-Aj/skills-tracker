import mongoose from 'mongoose'
import env from './env.js'
import logger from './logger.js'

const connectDB = async () => {
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongoUri, {
    maxPoolSize: env.mongoMaxPoolSize,
    minPoolSize: env.isProduction ? 2 : 0,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: !env.isProduction,
  })

  mongoose.connection.on('error', (error) => logger.error({ err: error }, 'MongoDB connection error'))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  logger.info('MongoDB connected')
}

export default connectDB
