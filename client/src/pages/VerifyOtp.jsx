import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import OtpInput from '../components/OtpInput'
import Toast from '../components/Toast'
import { AuthContext } from '../context/authContextValue'
import * as authService from '../services/authService'

const getErrorMessage = (err, fallback) => {
  const response = err.response?.data
  return response?.message || response?.errors?.[0]?.message || response?.errors?.[0]?.msg || fallback
}

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [toast, setToast] = useState({
    type: 'success',
    message: location.state?.message || '',
  })

  const canSubmit = useMemo(() => email.trim() && otp.length === 6 && !loading, [email, otp, loading])

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(current - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const verify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setToast({ type: 'success', message: '' })
    try {
      const response = await authService.verifyOtp({ email: email.trim(), otp })
      setToast({ type: 'success', message: 'Email verified. Redirecting...' })
      login(response.data.data || response.data)
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'OTP verification failed') })
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setToast({ type: 'success', message: '' })
    try {
      const response = await authService.resendOtp({ email: email.trim(), purpose: 'register' })
      setOtp('')
      setSecondsLeft(30)
      setToast({ type: 'success', message: response.data.message || 'A new OTP has been sent.' })
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to resend OTP') })
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="auth-layout reveal-item" aria-labelledby="verify-title">
      <aside className="auth-aside auth-aside--register">
        <div className="auth-aside__brand"><span><BarChart3 size={23} /></span><strong>Skills Tracker</strong></div>
        <div><p>Email security</p><h1>Verify once, then continue your learning workspace.</h1></div>
        <div className="auth-bars" aria-hidden="true"><i /><i /><i /><i /></div>
      </aside>

      <div className="auth-form-panel">
        <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />

        <div className="auth-heading">
          <p className="eyebrow"><ShieldCheck size={15} /> Verify email</p>
          <h2 id="verify-title">Enter OTP</h2>
          <p>Use the 6-digit code sent to your email.</p>
        </div>

        <form onSubmit={verify} className="auth-form" aria-busy={loading}>
          <div>
            <label htmlFor="verify-email" className="field-label">Email address</label>
            <div className="field-control field-control--icon">
              <Mail size={17} />
              <input id="verify-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="field-label">Verification code</label>
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          </div>

          <button type="submit" disabled={!canSubmit} className="button button--primary auth-submit">
            <span>{loading ? 'Verifying...' : 'Verify and continue'}</span>
            <ShieldCheck size={18} />
          </button>

          <div className="auth-inline-actions">
            <button type="button" onClick={() => navigate('/register')} className="button button--secondary"><ArrowLeft size={16} /> Edit details</button>
            <button type="button" onClick={resend} disabled={resending || secondsLeft > 0 || !email.trim()} className="button button--secondary">
              <RefreshCw size={16} /> {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </form>

        <p className="auth-switch">Already verified? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  )
}
