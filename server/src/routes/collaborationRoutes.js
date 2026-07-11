import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  createComment,
  createReminder,
  createTeam,
  deleteComment,
  deleteNotification,
  deleteReminder,
  getActivityFeed,
  getBookmarks,
  getComments,
  getMyPrivacy,
  getNotifications,
  getPublicProfile,
  getReminders,
  getSummary,
  getTeams,
  inviteMember,
  joinTeam,
  leaveTeam,
  markAllNotificationsRead,
  markNotificationRead,
  removeMember,
  toggleTargetBookmark,
  updateComment,
  updateMyPrivacy,
  updateReminder,
} from '../controllers/collaborationController.js'
import {
  activityValidator,
  commentIdValidator,
  createCommentValidator,
  joinTeamValidator,
  memberValidator,
  notificationIdValidator,
  notificationListValidator,
  privacyValidator,
  publicSlugValidator,
  reminderCreateValidator,
  reminderIdValidator,
  reminderUpdateValidator,
  targetValidator,
  teamCreateValidator,
  teamIdValidator,
  teamInviteValidator,
  updateCommentValidator,
} from '../validations/collaborationValidators.js'

const router = express.Router()

router.get('/public/:slug', publicSlugValidator, validate, getPublicProfile)

router.use(auth)

router.get('/summary', getSummary)

router.get('/privacy', getMyPrivacy)
router.put('/privacy', privacyValidator, validate, updateMyPrivacy)

router.get('/teams', getTeams)
router.post('/teams', teamCreateValidator, validate, createTeam)
router.post('/teams/join', joinTeamValidator, validate, joinTeam)
router.post('/teams/:teamId/invite', teamInviteValidator, validate, inviteMember)
router.delete('/teams/:teamId/members/:memberId', memberValidator, validate, removeMember)
router.post('/teams/:teamId/leave', teamIdValidator, validate, leaveTeam)

router.get('/activity', activityValidator, validate, getActivityFeed)

router.get('/comments/:targetType/:targetId', targetValidator, validate, getComments)
router.post('/comments/:targetType/:targetId', createCommentValidator, validate, createComment)
router.put('/comments/:commentId', updateCommentValidator, validate, updateComment)
router.delete('/comments/:commentId', commentIdValidator, validate, deleteComment)

router.get('/bookmarks', getBookmarks)
router.post('/bookmarks/:targetType/:targetId', targetValidator, validate, toggleTargetBookmark)

router.get('/notifications', notificationListValidator, validate, getNotifications)
router.patch('/notifications/read-all', markAllNotificationsRead)
router.patch('/notifications/:id/read', notificationIdValidator, validate, markNotificationRead)
router.delete('/notifications/:id', notificationIdValidator, validate, deleteNotification)

router.get('/reminders', getReminders)
router.post('/reminders', reminderCreateValidator, validate, createReminder)
router.put('/reminders/:id', reminderUpdateValidator, validate, updateReminder)
router.delete('/reminders/:id', reminderIdValidator, validate, deleteReminder)

export default router
