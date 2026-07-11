import express from 'express'
import {
  createAIInterview,
  createAINotesSummary,
  createAIPlanner,
  createAIQuiz,
  createAIRoadmap,
  getAIHistoryList,
  getAIRecommendations,
  getAIWeakTopics,
} from '../controllers/aiAssistantController.js'
import auth from '../middlewares/authMiddleware.js'
import { aiLimiter, aiReadLimiter } from '../middlewares/rateLimiters.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  aiHistoryValidator,
  interviewValidator,
  notesSummaryValidator,
  plannerValidator,
  quizValidator,
  roadmapValidator,
} from '../validations/aiAssistantValidators.js'

const router = express.Router()

router.use(auth)

router.post('/roadmap', aiLimiter, roadmapValidator, validate, createAIRoadmap)
router.post('/planner', aiLimiter, plannerValidator, validate, createAIPlanner)
router.post('/notes-summary', aiLimiter, notesSummaryValidator, validate, createAINotesSummary)
router.post('/quiz', aiLimiter, quizValidator, validate, createAIQuiz)
router.post('/interview', aiLimiter, interviewValidator, validate, createAIInterview)
router.get('/weak-topics', aiReadLimiter, getAIWeakTopics)
router.get('/recommendations', aiReadLimiter, getAIRecommendations)
router.get('/history', aiReadLimiter, aiHistoryValidator, validate, getAIHistoryList)

export default router
