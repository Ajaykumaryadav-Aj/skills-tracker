import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  createComment,
  deleteComment,
  getActivityFeed,
  getBookmarks,
  getComments,
  getMyPrivacy,
  getPublicProfile,
  getSummary,
  toggleTargetBookmark,
  updateComment,
  updateMyPrivacy,
} from '../controllers/collaborationController.js'
import {
  activityValidator,
  commentIdValidator,
  createCommentValidator,
  privacyValidator,
  publicSlugValidator,
  targetValidator,
  updateCommentValidator,
} from '../validations/collaborationValidators.js'

const router = express.Router()

router.get('/public/:slug', publicSlugValidator, validate, getPublicProfile)

router.use(auth)

router.get('/summary', getSummary)

router.get('/privacy', getMyPrivacy)
router.put('/privacy', privacyValidator, validate, updateMyPrivacy)

router.get('/activity', activityValidator, validate, getActivityFeed)

router.get('/comments/:targetType/:targetId', targetValidator, validate, getComments)
router.post('/comments/:targetType/:targetId', createCommentValidator, validate, createComment)
router.put('/comments/:commentId', updateCommentValidator, validate, updateComment)
router.delete('/comments/:commentId', commentIdValidator, validate, deleteComment)

router.get('/bookmarks', getBookmarks)
router.post('/bookmarks/:targetType/:targetId', targetValidator, validate, toggleTargetBookmark)

export default router
