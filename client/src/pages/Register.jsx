import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, UserRound, UserPlus } from 'lucide-react'
import Toast from '../components/Toast'
import * as authService from '../services/authService'
import { cn, ui } from '../utils/tw'

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
    <section className="reveal-item mx-auto grid w-full max-w-5xl overflow-hidden rounded-panel border border-line bg-white shadow-card lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="register-title">
      <aside className="relative min-h-64 overflow-hidden bg-gradient-to-br from-forest-deep via-forest to-forest-mid p-8 text-white">
        <div className="relative z-10 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-card border border-white/20 bg-emerald-brand shadow-lg"><BarChart3 size={23} /></span><strong>Skills Tracker</strong></div>
        <div className="relative z-10 mt-12 max-w-sm"><p className="text-xs font-extrabold uppercase text-mint">New workspace</p><h1 className="mt-3 text-3xl font-black leading-tight">Build a learning system that stays clear.</h1></div>
        <div className="absolute bottom-8 right-8 flex h-24 items-end gap-2 opacity-70" aria-hidden="true"><i className="h-8 w-5 rounded-t bg-mint" /><i className="h-14 w-5 rounded-t bg-sun" /><i className="h-20 w-5 rounded-t bg-coral" /><i className="h-11 w-5 rounded-t bg-white/70" /></div>
      </aside>

      <div className="p-6 sm:p-8 lg:p-10">
        <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />

        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-emerald-dark-brand"><UserPlus size={15} /> Create account</p>
          <h2 id="register-title" className="text-3xl font-black text-ink">Start learning</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Set up your personal tracking workspace. We will verify your email next.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4" aria-busy={loading}>
          <div>
            <label htmlFor="register-name" className={ui.field.label}>Full name</label>
            <div className={ui.field.control}><UserRound size={17} className="text-ink-muted" /><input className={ui.field.input} id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" required /></div>
          </div>
          <div>
            <label htmlFor="register-email" className={ui.field.label}>Email address</label>
            <div className={ui.field.control}><Mail size={17} className="text-ink-muted" /><input className={ui.field.input} id="register-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          </div>
          <div>
            <label htmlFor="register-password" className={ui.field.label}>Password</label>
            <div className={ui.field.control}>
              <LockKeyhole size={17} className="text-ink-muted" />
              <input className={ui.field.input} id="register-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="8" placeholder="Uppercase, number, special char" required />
              <button type="button" className="grid size-8 place-items-center rounded-card text-ink-soft hover:bg-emerald-pale hover:text-emerald-dark-brand" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className={cn(ui.button.base, ui.button.primary, 'w-full')}><span>{loading ? 'Sending OTP...' : 'Send OTP'}</span><ArrowRight size={18} /></button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">Already have an account? <Link to="/login" className="font-extrabold text-emerald-dark-brand hover:underline">Sign in</Link></p>
      </div>
    </section>
  )
}
