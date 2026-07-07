import express from 'express'
import authRoutes from './authRoutes.js'
import skillRoutes from './skillRoutes.js'
import learningLogRoutes from './learningLogRoutes.js'
import streakRoutes from './streakRoutes.js'
import roadmapRoutes from './roadmapRoutes.js'
import adminRoutes from './adminRoutes.js'
import userRoutes from './userRoutes.js'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/skills', skillRoutes)
router.use('/logs', learningLogRoutes)
router.use('/streak', streakRoutes)
router.use('/roadmaps', roadmapRoutes)
router.use('/admin', adminRoutes)
router.use('/users', userRoutes)

export default router
