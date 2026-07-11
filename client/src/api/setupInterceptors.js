import api from './axios'

// Response interceptor to handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common.Authorization
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
