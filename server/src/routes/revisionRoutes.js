import express from 'express'
import {
  completeRevision,
  generateTopicRevisionSchedule,
  getRevisions,
  getRevisionStats,
  skipRevision,
  snoozeRevision,
  updateRevisionNotes,
} from '../controllers/revisionController.js'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import { mongoIdParam } from '../validations/commonValidators.js'
import {
  generateRevisionValidator,
  revisionFilterValidator,
  revisionNotesValidator,
  snoozeRevisionValidator,
} from '../validations/revisionValidators.js'

const router = express.Router()

router.use(auth)

router.get('/', revisionFilterValidator, validate, getRevisions)
router.get('/stats', getRevisionStats)
router.post('/topics/:topicId/generate', mongoIdParam('topicId', 'Topic ID'), generateRevisionValidator, validate, generateTopicRevisionSchedule)
router.patch('/:id/complete', mongoIdParam('id', 'Revision ID'), revisionNotesValidator, validate, completeRevision)
router.patch('/:id/snooze', mongoIdParam('id', 'Revision ID'), snoozeRevisionValidator, validate, snoozeRevision)
router.patch('/:id/skip', mongoIdParam('id', 'Revision ID'), revisionNotesValidator, validate, skipRevision)
router.patch('/:id/notes', mongoIdParam('id', 'Revision ID'), revisionNotesValidator, validate, updateRevisionNotes)

export default router
