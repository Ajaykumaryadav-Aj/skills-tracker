import api from '../api/axios'

export const register = (payload) => api.post('/auth/register', payload)
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload)
export const resendOtp = (payload) => api.post('/auth/resend-otp', payload)
export const login = (payload) => api.post('/auth/login', payload)
export const me = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')
