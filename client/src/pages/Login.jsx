import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import Toast from '../components/Toast'
import * as authService from '../services/authService'
import { AuthContext } from '../context/authContextValue'

const getErrorMessage = (err, fallback) => {
  const response = err.response?.data
  return response?.message || response?.errors?.[0]?.message || response?.errors?.[0]?.msg || fallback
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState({ type: 'danger', message: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setToast({ type: 'danger', message: '' })
    setLoading(true)
    try {
      const res = await authService.login({ email: email.trim(), password })
      login(res.data.data || res.data)
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Login failed') })
      setLoading(false)
    }
  }

  return (
    <section className="auth-layout reveal-item" aria-labelledby="login-title">
      <aside className="auth-aside">
        <div className="auth-aside__brand"><span><BarChart3 size={23} /></span><strong>Skills Tracker</strong></div>
        <div><p>Learning workspace</p><h1>Pick up exactly where you left off.</h1></div>
        <div className="auth-bars" aria-hidden="true"><i /><i /><i /><i /></div>
      </aside>

      <div className="auth-form-panel">
        <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
        <div className="auth-heading">
          <p className="eyebrow"><LockKeyhole size={15} /> Secure access</p>
          <h2 id="login-title">Welcome back</h2>
          <p>Sign in to continue to your workspace.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading}>
          <div>
            <label htmlFor="login-email" className="field-label">Email address</label>
            <div className="field-control field-control--icon"><Mail size={17} /><input id="login-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          </div>
          <div>
            <label htmlFor="login-password" className="field-label">Password</label>
            <div className="field-control field-control--icon auth-password">
              <LockKeyhole size={17} />
              <input id="login-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="button button--primary auth-submit"><span>{loading ? 'Signing in...' : 'Sign in'}</span><ArrowRight size={18} /></button>
        </form>
        <p className="auth-switch">New to Skills Tracker? <Link to="/register">Create an account</Link></p>
      </div>
    </section>
  )
}
