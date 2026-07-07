import { useState } from 'react'
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import * as adminService from '../services/adminService'

export default function AdminLogin({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }

    try {
      setLoading(true)
      const response = await adminService.login({
        email: form.email.trim(),
        password: form.password,
      })
      const authData = response.data.data || response.data

      if (authData.user?.role !== 'admin') {
        setError('This account does not have admin access.')
        return
      }

      onAuthenticated(authData)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-layout">
        <section className="login-brand-panel" aria-labelledby="admin-brand-title">
          <div className="login-brand-lockup">
            <span className="login-logo" aria-hidden="true"><BarChart3 size={25} /></span>
            <span>Skills Tracker</span>
          </div>
          <div className="login-brand-copy">
            <p>Admin workspace</p>
            <h1 id="admin-brand-title">Keep learning operations in clear view.</h1>
          </div>
          <div className="login-visual" aria-hidden="true">
            <span style={{ '--bar-height': '44%', '--bar-color': 'var(--coral)' }} />
            <span style={{ '--bar-height': '72%', '--bar-color': 'var(--sun)' }} />
            <span style={{ '--bar-height': '58%', '--bar-color': 'var(--blue)' }} />
            <span style={{ '--bar-height': '88%', '--bar-color': 'var(--mint)' }} />
            <i />
          </div>
          <div className="secure-note"><ShieldCheck size={17} aria-hidden="true" /> Protected admin access</div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-heading">
            <p className="eyebrow"><LockKeyhole size={15} aria-hidden="true" /> Secure access</p>
            <h2 id="login-title">Welcome back</h2>
            <p>Sign in with your authorized admin account.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="admin-email">Email address</label>
              <div className="login-input">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="admin-password">Password</label>
              <div className="login-input">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && <div role="alert" aria-live="assertive" className="alert alert--danger">{error}</div>}

            <button type="submit" disabled={loading} className="login-submit">
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
