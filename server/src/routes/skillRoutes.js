import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import { createSkillValidator, updateSkillValidator } from '../validations/skillValidators.js'
import { createTopicValidator, reorderTopicsValidator, updateTopicValidator } from '../validations/topicValidators.js'
import {
	createSkill,
	getSkills,
	getSkill,
	getSkillStats,
	updateSkill,
	deleteSkill,
	toggleArchiveSkill,
	toggleFavoriteSkill,
	duplicateSkill,
	getTopics,
	getTopic,
	addTopic,
	updateTopic,
	deleteTopic,
	duplicateTopic,
	reorderTopics,
} from '../controllers/skillController.js'
import { getKnowledgeStats, globalKnowledgeSearch } from '../controllers/noteResourceController.js'
import { globalKnowledgeSearchValidator } from '../validations/noteResourceValidators.js'
import noteResourceRoutes from './noteResourceRoutes.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'
import { mongoIdParam } from '../validations/commonValidators.js'

const router = express.Router()
router.use(auth)

router.post('/', createSkillValidator, validate, createSkill)
router.get('/', cacheResponse(), getSkills)
router.get('/stats', cacheResponse(), getSkillStats)
router.get('/knowledge/stats', cacheResponse(), getKnowledgeStats)
router.get('/knowledge/search', globalKnowledgeSearchValidator, validate, cacheResponse(), globalKnowledgeSearch)
router.patch('/:id/archive', mongoIdParam('id', 'Skill ID'), validate, toggleArchiveSkill)
router.patch('/:id/favorite', mongoIdParam('id', 'Skill ID'), validate, toggleFavoriteSkill)
router.post('/:id/duplicate', mongoIdParam('id', 'Skill ID'), validate, duplicateSkill)
router.get('/:id', mongoIdParam('id', 'Skill ID'), validate, cacheResponse(), getSkill)
router.put('/:id', mongoIdParam('id', 'Skill ID'), updateSkillValidator, validate, updateSkill)
router.delete('/:id', mongoIdParam('id', 'Skill ID'), validate, deleteSkill)

// topics
router.get('/:id/topics', mongoIdParam('id', 'Skill ID'), validate, getTopics)
router.post('/:id/topics', mongoIdParam('id', 'Skill ID'), createTopicValidator, validate, addTopic)
router.patch('/:id/topics/reorder', mongoIdParam('id', 'Skill ID'), reorderTopicsValidator, validate, reorderTopics)
router.get(
  '/:id/topics/:topicId',
  [mongoIdParam('id', 'Skill ID'), mongoIdParam('topicId', 'Topic ID')],
  validate,
  getTopic,
)
router.put(
  '/:id/topics/:topicId',
  [mongoIdParam('id', 'Skill ID'), mongoIdParam('topicId', 'Topic ID')],
  updateTopicValidator,
  validate,
  updateTopic,
)
router.delete(
  '/:id/topics/:topicId',
  [mongoIdParam('id', 'Skill ID'), mongoIdParam('topicId', 'Topic ID')],
  validate,
  deleteTopic,
)
router.post(
  '/:id/topics/:topicId/duplicate',
  [mongoIdParam('id', 'Skill ID'), mongoIdParam('topicId', 'Topic ID')],
  validate,
  duplicateTopic,
)

// notes and resources
router.use('/:skillId/topics', noteResourceRoutes)
router.use('/:skillId', noteResourceRoutes)

export default router
