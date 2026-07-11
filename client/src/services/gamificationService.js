import api from '../api/axios'

export const getGamificationSummary = () => api.get('/gamification/me')
export const getGamificationChallenges = () => api.get('/gamification/challenges')
export const getLeaderboard = (params) => api.get('/gamification/leaderboard', { params })
