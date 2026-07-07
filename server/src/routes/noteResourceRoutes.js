import express from 'express'
import auth from '../middlewares/authMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import {
  addNoteValidator,
  updateNoteValidator,
  deleteNoteValidator,
  addResourceValidator,
  updateResourceValidator,
  deleteResourceValidator,
  toggleResourceFavoriteValidator,
  noteParamsValidator,
  resourceParamsValidator,
} from '../validations/noteResourceValidators.js'
import {
  addNote,
  getNote,
  updateNote,
  deleteNote,
  addResource,
  getResources,
  getResource,
  updateResource,
  deleteResource,
  toggleResourceFavorite,
} from '../controllers/noteResourceController.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'

const router = express.Router({ mergeParams: true })

// Protect all routes
router.use(auth)

// Note routes
router.post('/:topicId/notes', addNoteValidator, validate, addNote)
router.get('/:topicId/notes', noteParamsValidator, validate, cacheResponse(), getNote)
router.put('/:topicId/notes', updateNoteValidator, validate, updateNote)
router.delete('/:topicId/notes', deleteNoteValidator, validate, deleteNote)

// Resource routes
router.post('/:topicId/resources', addResourceValidator, validate, addResource)
router.get('/:topicId/resources', noteParamsValidator, validate, cacheResponse(), getResources)
router.get('/:topicId/resources/:resourceId', resourceParamsValidator, validate, cacheResponse(), getResource)
router.put('/:topicId/resources/:resourceId', updateResourceValidator, validate, updateResource)
router.delete('/:topicId/resources/:resourceId', deleteResourceValidator, validate, deleteResource)
router.patch('/:topicId/resources/:resourceId/favorite', toggleResourceFavoriteValidator, validate, toggleResourceFavorite)

export default router
