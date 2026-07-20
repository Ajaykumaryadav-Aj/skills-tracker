import express from 'express'
import {
  deleteUser,
  getDashboardAnalytics,
  getSkillsStatistics,
  getUsers,
  getAuditLogs,
  getAIUsageStats,
  getStorageUsageStats,
  updateUser,
  toggleUserStatus,
  verifyUserEmail,
  resetUserPassword,
  getSystemSettings,
  updateSystemSettings,
  getSkillsList,
  deleteSkillAdmin,
  getTopicsList,
  deleteTopicAdmin,
  getLogsList,
  deleteLogAdmin,
  getUploadedFilesList,
  deleteFileAdmin,
  getLogFileContent,
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
router.put('/users/:userId', updateUser)
router.patch('/users/:userId/status', toggleUserStatus)
router.patch('/users/:userId/verify-email', verifyUserEmail)
router.post('/users/:userId/reset-password', resetUserPassword)

router.get('/settings', getSystemSettings)
router.put('/settings', updateSystemSettings)

router.get('/content/skills', getSkillsList)
router.delete('/content/skills/:id', deleteSkillAdmin)
router.get('/content/topics', getTopicsList)
router.delete('/content/topics/:id', deleteTopicAdmin)
router.get('/content/logs', getLogsList)
router.delete('/content/logs/:id', deleteLogAdmin)

router.get('/files', getUploadedFilesList)
router.post('/files/delete', deleteFileAdmin)

router.get('/logs/view', getLogFileContent)

router.get('/audit-logs', getAuditLogs)
router.get('/ai-usage', getAIUsageStats)
router.get('/storage-usage', getStorageUsageStats)

export default router
