import { lazy, Suspense, useEffect, useState } from 'react'
import AdminLogin from './pages/AdminLogin'
import * as adminService from './services/adminService'

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

const getStoredAdmin = () => {
  try {
    const stored = localStorage.getItem('admin_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('admin_user')
    return null
  }
}

const clearAdminSession = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

export default function App() {
  const [admin, setAdmin] = useState(getStoredAdmin)
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem('admin_token')))

  useEffect(() => {
    let ignore = false

    const verifySession = async () => {
      const token = localStorage.getItem('admin_token')
      if (!token) return

      try {
        const response = await adminService.me()
        if (ignore) return
        const user = response.data.data?.user || response.data.user
        if (user?.role !== 'admin') {
          clearAdminSession()
          setAdmin(null)
          return
        }
        setAdmin(user)
        localStorage.setItem('admin_user', JSON.stringify(user))
      } catch {
        if (!ignore) {
          clearAdminSession()
          setAdmin(null)
        }
      } finally {
        if (!ignore) setCheckingSession(false)
      }
    }

    verifySession()
    const handleUnauthorized = () => setAdmin(null)
    window.addEventListener('admin:unauthorized', handleUnauthorized)

    return () => {
      ignore = true
      window.removeEventListener('admin:unauthorized', handleUnauthorized)
    }
  }, [])

  const handleAuthenticated = ({ user, token }) => {
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_user', JSON.stringify(user))
    setAdmin(user)
  }

  const handleLogout = async () => {
    try {
      await adminService.logout()
    } catch {
      // Local cleanup still completes when the API is unavailable.
    } finally {
      clearAdminSession()
      setAdmin(null)
    }
  }

  if (checkingSession) {
    return <div className="app-loader" role="status"><span />Checking session...</div>
  }

  if (!admin) return <AdminLogin onAuthenticated={handleAuthenticated} />

  return (
    <Suspense fallback={<div className="app-loader" role="status"><span />Loading dashboard...</div>}>
      <AdminDashboard admin={admin} onLogout={handleLogout} />
    </Suspense>
  )
}
