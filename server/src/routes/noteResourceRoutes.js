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
  listKnowledgeValidator,
  createNoteItemValidator,
  updateNoteItemValidator,
  noteItemParamsValidator,
} from '../validations/noteResourceValidators.js'
import {
  addNote,
  getNote,
  updateNote,
  deleteNote,
  getKnowledgeHub,
  getNotes,
  createNoteItem,
  updateNoteItem,
  deleteNoteItem,
  toggleNotePin,
  toggleNoteFavorite,
  addResource,
  getResources,
  getResource,
  updateResource,
  deleteResource,
  toggleResourceFavorite,
} from '../controllers/noteResourceController.js'
import { cacheResponse } from '../middlewares/cacheMiddleware.js'
import { uploadKnowledgeAttachment } from '../middlewares/uploadMiddleware.js'

const router = express.Router({ mergeParams: true })

// Protect all routes
router.use(auth)

// Note routes
router.post('/:topicId/notes', addNoteValidator, validate, addNote)
router.get('/:topicId/notes', noteParamsValidator, validate, cacheResponse(), getNote)
router.put('/:topicId/notes', updateNoteValidator, validate, updateNote)
router.delete('/:topicId/notes', deleteNoteValidator, validate, deleteNote)

// Knowledge hub note collection routes
router.get('/:topicId/hub', listKnowledgeValidator, validate, cacheResponse(), getKnowledgeHub)
router.get('/:topicId/note-items', listKnowledgeValidator, validate, cacheResponse(), getNotes)
router.post('/:topicId/note-items', createNoteItemValidator, validate, createNoteItem)
router.put('/:topicId/note-items/:noteId', updateNoteItemValidator, validate, updateNoteItem)
router.delete('/:topicId/note-items/:noteId', noteItemParamsValidator, validate, deleteNoteItem)
router.patch('/:topicId/note-items/:noteId/pin', noteItemParamsValidator, validate, toggleNotePin)
router.patch('/:topicId/note-items/:noteId/favorite', noteItemParamsValidator, validate, toggleNoteFavorite)

// Resource routes
router.post('/:topicId/resources', uploadKnowledgeAttachment, addResourceValidator, validate, addResource)
router.get('/:topicId/resources', noteParamsValidator, validate, cacheResponse(), getResources)
router.get('/:topicId/resources/:resourceId', resourceParamsValidator, validate, cacheResponse(), getResource)
router.put('/:topicId/resources/:resourceId', uploadKnowledgeAttachment, updateResourceValidator, validate, updateResource)
router.delete('/:topicId/resources/:resourceId', deleteResourceValidator, validate, deleteResource)
router.patch('/:topicId/resources/:resourceId/favorite', toggleResourceFavoriteValidator, validate, toggleResourceFavorite)

export default router
