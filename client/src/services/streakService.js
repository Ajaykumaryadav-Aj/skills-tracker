import api from '../api/axios'

export const getStreakSummary = () => api.get('/streak')
