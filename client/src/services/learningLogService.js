import api from '../api/axios'

export const getLearningLogs = (params) => api.get('/logs', { params })
export const createLearningLog = (payload) => api.post('/logs', payload)
export const updateLearningLog = (id, payload) => api.put(`/logs/${id}`, payload)
export const deleteLearningLog = (id) => api.delete(`/logs/${id}`)
