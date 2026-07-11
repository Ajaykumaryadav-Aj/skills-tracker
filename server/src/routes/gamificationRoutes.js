import express from 'express'
import {
  getGamificationChallenges,
  getGamificationLeaderboard,
  getGamificationMe,
} from '../controllers/gamificationController.js'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import { leaderboardValidator } from '../validations/gamificationValidators.js'

const router = express.Router()

router.use(auth)

router.get('/me', getGamificationMe)
router.get('/challenges', getGamificationChallenges)
router.get('/leaderboard', leaderboardValidator, validate, getGamificationLeaderboard)

export default router
