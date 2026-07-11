import api from '../api/axios'

const base = '/collaboration'

export const getSummary = () => api.get(`${base}/summary`)

export const getPrivacy = () => api.get(`${base}/privacy`)
export const updatePrivacy = (payload) => api.put(`${base}/privacy`, payload)
export const getPublicProfile = (slug) => api.get(`${base}/public/${slug}`)

export const getTeams = () => api.get(`${base}/teams`)
export const createTeam = (payload) => api.post(`${base}/teams`, payload)
export const joinTeam = (inviteCode) => api.post(`${base}/teams/join`, { inviteCode })
export const inviteMember = (teamId, payload) => api.post(`${base}/teams/${teamId}/invite`, payload)
export const removeMember = (teamId, memberId) => api.delete(`${base}/teams/${teamId}/members/${memberId}`)
export const leaveTeam = (teamId) => api.post(`${base}/teams/${teamId}/leave`)

export const getActivity = (params = {}) => api.get(`${base}/activity`, { params })

export const getComments = (targetType, targetId) => api.get(`${base}/comments/${targetType}/${targetId}`)
export const addComment = (targetType, targetId, payload) => api.post(`${base}/comments/${targetType}/${targetId}`, payload)
export const updateComment = (commentId, payload) => api.put(`${base}/comments/${commentId}`, payload)
export const deleteComment = (commentId) => api.delete(`${base}/comments/${commentId}`)

export const getBookmarks = () => api.get(`${base}/bookmarks`)
export const toggleBookmark = (targetType, targetId) => api.post(`${base}/bookmarks/${targetType}/${targetId}`)

export const getNotifications = (params = {}) => api.get(`${base}/notifications`, { params })
export const markNotificationRead = (id) => api.patch(`${base}/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.patch(`${base}/notifications/read-all`)
export const deleteNotification = (id) => api.delete(`${base}/notifications/${id}`)

export const getReminders = () => api.get(`${base}/reminders`)
export const createReminder = (payload) => api.post(`${base}/reminders`, payload)
export const updateReminder = (id, payload) => api.put(`${base}/reminders/${id}`, payload)
export const deleteReminder = (id) => api.delete(`${base}/reminders/${id}`)
