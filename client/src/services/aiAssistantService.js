import api from '../api/axios'

const aiRequest = { timeout: 60000 }

export const generateRoadmap = (payload) => api.post('/ai/roadmap', payload, aiRequest)
export const generatePlanner = (payload) => api.post('/ai/planner', payload, aiRequest)
export const summarizeNotes = (payload) => api.post('/ai/notes-summary', payload, aiRequest)
export const generateQuiz = (payload) => api.post('/ai/quiz', payload, aiRequest)
export const generateInterview = (payload) => api.post('/ai/interview', payload, aiRequest)
export const getWeakTopics = () => api.get('/ai/weak-topics', aiRequest)
export const getRecommendations = () => api.get('/ai/recommendations', aiRequest)
export const getHistory = (params) => api.get('/ai/history', { params })
