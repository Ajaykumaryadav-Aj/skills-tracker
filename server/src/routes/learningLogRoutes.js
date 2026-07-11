import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  createLearningLog,
  getLearningLogs,
  getLearningProgress,
  updateLearningGoals,
  exportLearningLogsCsv,
  updateLearningLog,
  deleteLearningLog,
} from '../controllers/learningLogController.js'
import { createLogValidator, updateLogValidator, historyFilterValidator, goalsValidator } from '../validations/learningLogValidators.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'
import { mongoIdParam } from '../validations/commonValidators.js'

const router = express.Router()
router.use(auth)

router.post('/', createLogValidator, validate, createLearningLog)
router.get('/progress', cacheResponse(), getLearningProgress)
router.put('/goals', goalsValidator, validate, updateLearningGoals)
router.get('/export.csv', exportLearningLogsCsv)
router.get('/', historyFilterValidator, validate, cacheResponse(), getLearningLogs)
router.put('/:id', updateLogValidator, validate, updateLearningLog)
router.delete('/:id', mongoIdParam('id', 'Learning log ID'), validate, deleteLearningLog)

export default router
