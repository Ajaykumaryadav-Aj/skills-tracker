import api from '../api/client'

export const login = (payload) => api.post('/auth/login', payload)
export const me = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')
export const getAnalytics = () => api.get('/admin/analytics')
export const getSkillsStatistics = () => api.get('/admin/skills-statistics')
export const getUsers = (params) => api.get('/admin/users', { params })
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`)
