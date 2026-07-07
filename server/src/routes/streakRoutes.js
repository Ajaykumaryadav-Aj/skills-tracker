import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import { getStreakSummary } from '../controllers/streakController.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'

const router = express.Router()
router.use(auth)
router.get('/', cacheResponse(), getStreakSummary)

export default router
