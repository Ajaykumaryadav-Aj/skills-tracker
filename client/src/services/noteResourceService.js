import api from '../api/axios'

const topicBasePath = (skillId, topicId) => `/skills/${skillId}/topics/${topicId}`

// ============== NOTES ==============

export const addNote = (skillId, topicId, data) =>
  api.post(`${topicBasePath(skillId, topicId)}/notes`, data)

export const getNote = (skillId, topicId) =>
  api.get(`${topicBasePath(skillId, topicId)}/notes`)

export const updateNote = (skillId, topicId, data) =>
  api.put(`${topicBasePath(skillId, topicId)}/notes`, data)

export const deleteNote = (skillId, topicId) =>
  api.delete(`${topicBasePath(skillId, topicId)}/notes`)

export const getKnowledgeHub = (skillId, topicId, params) =>
  api.get(`${topicBasePath(skillId, topicId)}/hub`, { params })

export const getNoteItems = (skillId, topicId, params) =>
  api.get(`${topicBasePath(skillId, topicId)}/note-items`, { params })

export const createNoteItem = (skillId, topicId, data) =>
  api.post(`${topicBasePath(skillId, topicId)}/note-items`, data)

export const updateNoteItem = (skillId, topicId, noteId, data) =>
  api.put(`${topicBasePath(skillId, topicId)}/note-items/${noteId}`, data)

export const deleteNoteItem = (skillId, topicId, noteId) =>
  api.delete(`${topicBasePath(skillId, topicId)}/note-items/${noteId}`)

export const toggleNotePin = (skillId, topicId, noteId) =>
  api.patch(`${topicBasePath(skillId, topicId)}/note-items/${noteId}/pin`)

export const toggleNoteFavorite = (skillId, topicId, noteId) =>
  api.patch(`${topicBasePath(skillId, topicId)}/note-items/${noteId}/favorite`)

// ============== RESOURCES ==============

export const addResource = (skillId, topicId, data) =>
  api.post(`${topicBasePath(skillId, topicId)}/resources`, data)

export const getResources = (skillId, topicId) =>
  api.get(`${topicBasePath(skillId, topicId)}/resources`)

export const getResource = (skillId, topicId, resourceId) =>
  api.get(`${topicBasePath(skillId, topicId)}/resources/${resourceId}`)

export const updateResource = (skillId, topicId, resourceId, data) =>
  api.put(`${topicBasePath(skillId, topicId)}/resources/${resourceId}`, data)

export const deleteResource = (skillId, topicId, resourceId) =>
  api.delete(`${topicBasePath(skillId, topicId)}/resources/${resourceId}`)

export const toggleResourceFavorite = (skillId, topicId, resourceId) =>
  api.patch(`${topicBasePath(skillId, topicId)}/resources/${resourceId}/favorite`)

export const getKnowledgeStats = () =>
  api.get('/skills/knowledge/stats')

export const globalKnowledgeSearch = (params) =>
  api.get('/skills/knowledge/search', { params })
