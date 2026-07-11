import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import * as authService from '../services/authService'
import { AuthContext } from './authContextValue'

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`

    if (token) {
      let ignore = false
      authService
        .me()
        .then((res) => {
          if (ignore) return
          const nextUser = res.data.data?.user || res.data.user
          setUser((currentUser) => {
            const mergedUser = currentUser ? { ...currentUser, ...nextUser } : nextUser
            localStorage.setItem('user', JSON.stringify(mergedUser))
            return mergedUser
          })
        })
        .catch(() => {
          if (ignore) return
          setUser(null)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })

      return () => {
        ignore = true
      }
    }
  }, [])

  const login = useCallback((data) => {
    const authData = data.data || data
    // data: { user, token }
    setUser(authData.user)
    localStorage.setItem('user', JSON.stringify(authData.user))
    localStorage.setItem('token', authData.token)
    api.defaults.headers.common.Authorization = `Bearer ${authData.token}`
    // redirect to home on successful login
    window.location.href = '/'
  }, [])

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    localStorage.setItem('user', JSON.stringify(nextUser))
  }, [])

  const logout = useCallback(() => {
    // notify server then clear
    try {
      authService.logout().catch(() => {})
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      delete api.defaults.headers.common.Authorization
      window.location.href = '/login'
    }
  }, [])

  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    updateUser,
  }), [user, login, logout, updateUser])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
