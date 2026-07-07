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
