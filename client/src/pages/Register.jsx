import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, UserRound, UserPlus } from 'lucide-react'
import Toast from '../components/Toast'
import * as authService from '../services/authService'

const getErrorMessage = (err, fallback) => {
  const response = err.response?.data
  return response?.message || response?.errors?.[0]?.message || response?.errors?.[0]?.msg || fallback
}

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState({ type: 'success', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setToast({ type: 'success', message: '' })
    setLoading(true)
    try {
      const response = await authService.register({ name: name.trim(), email: email.trim(), password })
      navigate('/verify-otp', {
        state: {
          email: email.trim(),
          message: response.data.message || 'OTP sent to your email.',
        },
      })
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Registration failed') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-layout reveal-item" aria-labelledby="register-title">
      <aside className="auth-aside auth-aside--register">
        <div className="auth-aside__brand"><span><BarChart3 size={23} /></span><strong>Skills Tracker</strong></div>
        <div><p>New workspace</p><h1>Build a learning system that stays clear.</h1></div>
        <div className="auth-bars" aria-hidden="true"><i /><i /><i /><i /></div>
      </aside>

      <div className="auth-form-panel">
        <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />

        <div className="auth-heading">
          <p className="eyebrow"><UserPlus size={15} /> Create account</p>
          <h2 id="register-title">Start learning</h2>
          <p>Set up your personal tracking workspace. We will verify your email next.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading}>
          <div>
            <label htmlFor="register-name" className="field-label">Full name</label>
            <div className="field-control field-control--icon"><UserRound size={17} /><input id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" required /></div>
          </div>
          <div>
            <label htmlFor="register-email" className="field-label">Email address</label>
            <div className="field-control field-control--icon"><Mail size={17} /><input id="register-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          </div>
          <div>
            <label htmlFor="register-password" className="field-label">Password</label>
            <div className="field-control field-control--icon auth-password">
              <LockKeyhole size={17} />
              <input id="register-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="8" placeholder="Uppercase, number, special char" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="button button--primary auth-submit"><span>{loading ? 'Sending OTP...' : 'Send OTP'}</span><ArrowRight size={18} /></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  )
}
