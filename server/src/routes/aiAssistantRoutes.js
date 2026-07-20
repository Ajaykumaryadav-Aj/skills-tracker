import express from 'express'
import {
  createAIChat,
  createAIDebug,
  createAIInterview,
  createAINotes,
  createAINotesSummary,
  createAIPlanner,
  createAIResources,
  createAIStructuredRoadmap,
  getAIHistoryList,
  getAIRecommendations,
  getAIWeakTopics,
} from '../controllers/aiAssistantController.js'
import auth from '../middlewares/authMiddleware.js'
import { aiLimiter, aiReadLimiter } from '../middlewares/rateLimiters.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  aiHistoryValidator,
  chatValidator,
  debugValidator,
  interviewValidator,
  notesSummaryValidator,
  notesValidator,
  plannerValidator,
  resourcesValidator,
} from '../validations/aiAssistantValidators.js'

const router = express.Router()

router.use(auth)

router.post('/chat', aiLimiter, chatValidator, validate, createAIChat)
router.post('/debug', aiLimiter, debugValidator, validate, createAIDebug)
router.post('/notes', aiLimiter, notesValidator, validate, createAINotes)
router.post('/resources', aiLimiter, resourcesValidator, validate, createAIResources)
router.post('/generate-roadmap', aiLimiter, createAIStructuredRoadmap)
router.post('/planner', aiLimiter, plannerValidator, validate, createAIPlanner)
router.post('/notes-summary', aiLimiter, notesSummaryValidator, validate, createAINotesSummary)
router.post('/interview', aiLimiter, interviewValidator, validate, createAIInterview)
router.get('/weak-topics', aiReadLimiter, getAIWeakTopics)
router.get('/recommendations', aiReadLimiter, getAIRecommendations)
router.get('/history', aiReadLimiter, aiHistoryValidator, validate, getAIHistoryList)

export default router
