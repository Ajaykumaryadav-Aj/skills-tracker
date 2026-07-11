import api from '../api/axios'

export const getProfile = () => api.get('/users/profile')
export const updateProfile = (payload) => api.put('/users/profile', payload)
export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.post('/users/avatar', formData, {
    headers: {},
  })
}
export const deleteAvatar = () => api.delete('/users/avatar')
export const changePassword = (payload) => api.put('/users/change-password', payload)
