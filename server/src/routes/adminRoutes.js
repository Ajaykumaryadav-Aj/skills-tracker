import express from 'express'
import {
  deleteUser,
  getDashboardAnalytics,
  getSkillsStatistics,
  getUsers,
  getAuditLogs,
  getAIUsageStats,
  getStorageUsageStats,
} from '../controllers/adminController.js'
import auth from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/roleMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import { adminUsersQueryValidator, deleteUserValidator } from '../validations/adminValidators.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'

const router = express.Router()

router.use(auth, requireAdmin)

router.get('/analytics', cacheResponse(), getDashboardAnalytics)
router.get('/skills-statistics', cacheResponse(), getSkillsStatistics)
router.get('/users', adminUsersQueryValidator, validate, cacheResponse(), getUsers)
router.delete('/users/:userId', deleteUserValidator, validate, deleteUser)
router.get('/audit-logs', getAuditLogs)
router.get('/ai-usage', getAIUsageStats)
router.get('/storage-usage', getStorageUsageStats)

export default router
