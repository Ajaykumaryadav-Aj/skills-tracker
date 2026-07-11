import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '../utils/tw'

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null

  const tone = {
    danger: ['border-red-200 bg-red-50 text-red-700', XCircle],
    warning: ['border-yellow-200 bg-yellow-50 text-yellow-800', AlertTriangle],
    info: ['border-blue-brand/20 bg-blue-pale text-blue-brand', Info],
    success: ['border-emerald-brand/20 bg-emerald-pale text-emerald-dark-brand', CheckCircle2],
  }[type] || ['border-emerald-brand/20 bg-emerald-pale text-emerald-dark-brand', CheckCircle2]
  const Icon = tone[1]

  return (
    <div
      className={cn(
        'fixed right-4 top-4 z-[260] flex max-w-[min(92vw,420px)] items-center gap-3 rounded-panel border px-4 py-3 text-sm font-bold shadow-card-hover backdrop-blur animate-[toast-in_220ms_cubic-bezier(0.16,1,0.3,1)]',
        tone[0],
      )}
      role={type === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon size={18} aria-hidden="true" />
      <span className="min-w-0 flex-1">{message}</span>
      <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full transition hover:bg-black/5" aria-label="Dismiss notification" title="Dismiss notification"><X size={15} /></button>
    </div>
  )
}
