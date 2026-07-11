import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { ui } from '../utils/tw'

export default function Modal({ open, title, children, onClose }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-ink/45 px-4 py-6 backdrop-blur-sm animate-[fade-in_180ms_ease-out]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-panel border border-line bg-white p-5 shadow-card-hover outline-none animate-[modal-in_220ms_cubic-bezier(0.16,1,0.3,1)] sm:p-6"
      >
        <div className="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-line bg-surface-raised/80 px-5 py-4 sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 id={titleId} className="text-xl font-black text-ink">{title}</h2>
          <button type="button" onClick={onClose} className={ui.button.icon} aria-label="Close dialog" title="Close dialog">
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
