import api from '../api/axios'

const base = '/collaboration'

export const getSummary = () => api.get(`${base}/summary`)

export const getPrivacy = () => api.get(`${base}/privacy`)
export const updatePrivacy = (payload) => api.put(`${base}/privacy`, payload)
export const getPublicProfile = (slug) => api.get(`${base}/public/${slug}`)

export const getActivity = (params = {}) => api.get(`${base}/activity`, { params })

export const getComments = (targetType, targetId) => api.get(`${base}/comments/${targetType}/${targetId}`)
export const addComment = (targetType, targetId, payload) => api.post(`${base}/comments/${targetType}/${targetId}`, payload)
export const updateComment = (commentId, payload) => api.put(`${base}/comments/${commentId}`, payload)
export const deleteComment = (commentId) => api.delete(`${base}/comments/${commentId}`)

export const getBookmarks = () => api.get(`${base}/bookmarks`)
export const toggleBookmark = (targetType, targetId) => api.post(`${base}/bookmarks/${targetType}/${targetId}`)
