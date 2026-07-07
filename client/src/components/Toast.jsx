import { CheckCircle2, XCircle } from 'lucide-react'

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null

  const Icon = type === 'danger' ? XCircle : CheckCircle2

  return (
    <div className={`toast toast--${type}`} role={type === 'danger' ? 'alert' : 'status'} aria-live="polite">
      <Icon size={18} aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" title="Dismiss notification">x</button>
    </div>
  )
}
