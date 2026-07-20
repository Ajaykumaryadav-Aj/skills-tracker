import api from '../api/axios'

const aiRequest = { timeout: 180000 } // 3 minutes timeout for AI assistant requests

export const generateChat = (payload) => api.post('/ai/chat', payload, aiRequest)
export const debugCode = (payload) => api.post('/ai/debug', payload, aiRequest)
export const generateNotes = (payload) => api.post('/ai/notes', payload, aiRequest)
export const generateResources = (payload) => api.post('/ai/resources', payload, aiRequest)
export const generatePlanner = (payload) => api.post('/ai/planner', payload, aiRequest)
export const generateInterview = (payload) => api.post('/ai/interview', payload, aiRequest)
export const getWeakTopics = () => api.get('/ai/weak-topics', aiRequest)
export const getRecommendations = () => api.get('/ai/recommendations', aiRequest)
export const getHistory = (params) => api.get('/ai/history', { params })
export const getHistoryItem = (id) => api.get(`/ai/history/${id}`)
export const deleteHistoryItem = (id) => api.delete(`/ai/history/${id}`)
export const deleteAllHistory = () => api.delete('/ai/history')
export const summarizeNotes = (payload) => api.post('/ai/notes-summary', payload, aiRequest)

