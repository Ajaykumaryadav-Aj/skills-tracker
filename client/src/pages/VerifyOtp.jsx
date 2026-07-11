import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import OtpInput from '../components/OtpInput'
import Toast from '../components/Toast'
import { AuthContext } from '../context/authContextValue'
import * as authService from '../services/authService'
import { cn, ui } from '../utils/tw'

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
    <section className="reveal-item mx-auto grid w-full max-w-5xl overflow-hidden rounded-panel border border-line bg-white shadow-card lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="verify-title">
      <aside className="relative min-h-64 overflow-hidden bg-gradient-to-br from-forest-deep via-forest to-forest-mid p-8 text-white">
        <div className="relative z-10 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-card border border-white/20 bg-emerald-brand shadow-lg"><BarChart3 size={23} /></span><strong>Skills Tracker</strong></div>
        <div className="relative z-10 mt-12 max-w-sm"><p className="text-xs font-extrabold uppercase text-mint">Email security</p><h1 className="mt-3 text-3xl font-black leading-tight">Verify once, then continue your learning workspace.</h1></div>
        <div className="absolute bottom-8 right-8 flex h-24 items-end gap-2 opacity-70" aria-hidden="true"><i className="h-8 w-5 rounded-t bg-mint" /><i className="h-14 w-5 rounded-t bg-sun" /><i className="h-20 w-5 rounded-t bg-coral" /><i className="h-11 w-5 rounded-t bg-white/70" /></div>
      </aside>

      <div className="p-6 sm:p-8 lg:p-10">
        <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />

        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-emerald-dark-brand"><ShieldCheck size={15} /> Verify email</p>
          <h2 id="verify-title" className="text-3xl font-black text-ink">Enter OTP</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Use the 6-digit code sent to your email.</p>
        </div>

        <form onSubmit={verify} className="mt-6 grid gap-4" aria-busy={loading}>
          <div>
            <label htmlFor="verify-email" className={ui.field.label}>Email address</label>
            <div className={ui.field.control}>
              <Mail size={17} className="text-ink-muted" />
              <input className={ui.field.input} id="verify-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className={ui.field.label}>Verification code</label>
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          </div>

          <button type="submit" disabled={!canSubmit} className={cn(ui.button.base, ui.button.primary, 'w-full')}>
            <span>{loading ? 'Verifying...' : 'Verify and continue'}</span>
            <ShieldCheck size={18} />
          </button>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => navigate('/register')} className={cn(ui.button.base, ui.button.secondary)}><ArrowLeft size={16} /> Edit details</button>
            <button type="button" onClick={resend} disabled={resending || secondsLeft > 0 || !email.trim()} className={cn(ui.button.base, ui.button.secondary)}>
              <RefreshCw size={16} /> {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-ink-soft">Already verified? <Link to="/login" className="font-extrabold text-emerald-dark-brand hover:underline">Sign in</Link></p>
      </div>
    </section>
  )
}
