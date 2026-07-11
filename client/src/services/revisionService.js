import api from '../api/axios'

export const getRevisions = (params) => api.get('/revisions', { params })
export const getRevisionStats = () => api.get('/revisions/stats')
export const generateTopicSchedule = (topicId, payload) => api.post(`/revisions/topics/${topicId}/generate`, payload)
export const completeRevision = (id, payload = {}) => api.patch(`/revisions/${id}/complete`, payload)
export const snoozeRevision = (id, payload) => api.patch(`/revisions/${id}/snooze`, payload)
export const skipRevision = (id, payload = {}) => api.patch(`/revisions/${id}/skip`, payload)
export const updateRevisionNotes = (id, payload) => api.patch(`/revisions/${id}/notes`, payload)
