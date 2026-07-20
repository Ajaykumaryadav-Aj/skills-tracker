import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  createRoadmapValidator,
  updateRoadmapValidator,
  importTemplateValidator,
  addSkillToRoadmapValidator,
  updateRoadmapSkillValidator,
  addTopicToRoadmapSkillValidator,
  reorderRoadmapSkillsValidator,
} from '../validations/roadmapValidators.js'
import {
  createRoadmap,
  getRoadmaps,
  getRoadmap,
  updateRoadmap,
  deleteRoadmap,
  getTemplates,
  getTemplate,
  getTemplateByName,
  importTemplate,
  addSkillToRoadmap,
  updateRoadmapSkill,
  addTopicToSkill,
  deleteRoadmapSkill,
  getRoadmapStats,
  reorderRoadmapSkills,
} from '../controllers/roadmapController.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'
import { mongoIdParam, safeNameParam } from '../validations/commonValidators.js'

const router = express.Router()

// Templates (public)
router.get('/templates', cacheResponse({ ttlSeconds: 300, scope: 'public' }), getTemplates)
router.get(
  '/templates/:id',
  mongoIdParam('id', 'Template ID'),
  validate,
  cacheResponse({ ttlSeconds: 300, scope: 'public' }),
  getTemplate,
)
router.get(
  '/templates/name/:name',
  safeNameParam('name', 'Template name'),
  validate,
  cacheResponse({ ttlSeconds: 300, scope: 'public' }),
  getTemplateByName,
)

// Protected routes
router.use(auth)

// Roadmaps
router.post('/', createRoadmapValidator, validate, createRoadmap)
router.get('/', cacheResponse(), getRoadmaps)
router.get('/stats', cacheResponse(), getRoadmapStats)
router.get('/:id', mongoIdParam('id', 'Roadmap ID'), validate, cacheResponse(), getRoadmap)
router.put('/:id', mongoIdParam('id', 'Roadmap ID'), updateRoadmapValidator, validate, updateRoadmap)
router.delete('/:id', mongoIdParam('id', 'Roadmap ID'), validate, deleteRoadmap)

// Import template
router.post('/:templateId/import', importTemplateValidator, validate, importTemplate)

// Skills management
router.post('/:roadmapId/skills', addSkillToRoadmapValidator, validate, addSkillToRoadmap)
router.put('/:roadmapId/skills/reorder', reorderRoadmapSkillsValidator, validate, reorderRoadmapSkills)
router.put('/:roadmapId/skills/:skillId', updateRoadmapSkillValidator, validate, updateRoadmapSkill)
router.delete(
  '/:roadmapId/skills/:skillId',
  [mongoIdParam('roadmapId', 'Roadmap ID'), mongoIdParam('skillId', 'Skill ID')],
  validate,
  deleteRoadmapSkill,
)

// Topics in skills
router.post(
  '/:roadmapId/skills/:skillId/topics',
  addTopicToRoadmapSkillValidator,
  validate,
  addTopicToSkill,
)

export default router
