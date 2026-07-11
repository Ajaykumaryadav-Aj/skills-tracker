import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if ([401, 403].includes(error.response?.status) && error.config?.url?.startsWith('/admin')) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.dispatchEvent(new Event('admin:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
