import { useState } from 'react'
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import * as adminService from '../services/adminService'

export default function AdminLogin({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState('login') // login, forgot, verify, reset
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

  const handleForgotSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!form.email.trim()) {
      setError('Email address is required.')
      return
    }

    try {
      setLoading(true)
      await adminService.forgotPassword({ email: form.email.trim() })
      setMode('verify')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP code.')
      return
    }

    try {
      setLoading(true)
      await adminService.verifyForgotOtp({ email: form.email.trim(), otp })
      setMode('reset')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      await adminService.resetPassword({ email: form.email.trim(), password: newPassword })
      setSuccessMsg('Password has been reset successfully. Redirecting...')
      setTimeout(() => {
        setForm(current => ({ ...current, password: '' }))
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccessMsg('')
        setMode('login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.')
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
            <h2 id="login-title">
              {mode === 'login' && 'Welcome back'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'verify' && 'Verify Identity'}
              {mode === 'reset' && 'Choose Password'}
            </h2>
            <p>
              {mode === 'login' && 'Sign in with your authorized admin account.'}
              {mode === 'forgot' && 'Enter your admin email to request a reset code.'}
              {mode === 'verify' && 'We have sent a verification code to your email.'}
              {mode === 'reset' && 'Set a new secure password for your account.'}
            </p>
          </div>

          {mode === 'login' && (
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
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="admin-password" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setSuccessMsg('')
                      setMode('forgot')
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition"
                  >
                    Forgot password?
                  </button>
                </div>
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
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="forgot-email">Email address</label>
                <div className="login-input">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              {error && <div role="alert" className="alert alert--danger">{error}</div>}

              <button type="submit" disabled={loading} className="login-submit">
                <span>{loading ? 'Sending OTP...' : 'Send Reset OTP'}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccessMsg('')
                  setMode('login')
                }}
                className="w-full text-center mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition"
              >
                Back to Login
              </button>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="otp">Enter 6-digit OTP</label>
                <div className="login-input">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="123456"
                  />
                </div>
              </div>

              {error && <div role="alert" className="alert alert--danger">{error}</div>}

              <button type="submit" disabled={loading} className="login-submit">
                <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccessMsg('')
                  setMode('login')
                }}
                className="w-full text-center mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition"
              >
                Back to Login
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="new-password">New Password</label>
                <div className="login-input">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="login-input">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {error && <div role="alert" className="alert alert--danger">{error}</div>}
              {successMsg && <div role="alert" className="alert alert--success">{successMsg}</div>}

              <button type="submit" disabled={loading} className="login-submit">
                <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccessMsg('')
                  setMode('login')
                }}
                className="w-full text-center mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition"
              >
                Back to Login
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
