import { forwardRef } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import { cn, ui } from '../utils/tw'

export const Button = forwardRef(function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) {
  const variants = {
    primary: ui.button.primary,
    secondary: ui.button.secondary,
    danger: ui.button.danger,
    ghost: 'border-transparent bg-transparent text-ink hover:bg-surface-raised',
  }
  const sizes = {
    sm: 'min-h-9 px-3 text-xs',
    md: '',
    lg: 'min-h-12 px-5 text-base',
  }

  return (
    <Component ref={ref} className={cn(ui.button.base, variants[variant] || variants.primary, sizes[size], className)} {...props}>
      {children}
    </Component>
  )
})

export function Card({ className = '', children, ...props }) {
  return <section className={cn(ui.card, 'p-5 sm:p-6', className)} {...props}>{children}</section>
}

export function Badge({ tone = 'idle', className = '', children, ...props }) {
  return <span className={cn(ui.badge.base, ui.badge[tone] || ui.badge.idle, className)} {...props}>{children}</span>
}

export function SectionHeader({ eyebrow, title, description, icon: Icon, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-emerald-dark-brand">
            {Icon && <Icon size={15} aria-hidden="true" />}{eyebrow}
          </p>
        )}
        <h2 className="text-xl font-black leading-tight text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, tone = 'default' }) {
  return (
    <div className={cn(ui.empty, tone === 'danger' && 'border-red-200 bg-red-50 text-red-700')}>
      <span className={cn('grid size-12 place-items-center rounded-card', tone === 'danger' ? 'bg-red-100 text-red-700' : 'bg-emerald-pale text-emerald-dark-brand')} aria-hidden="true">
        <Icon size={24} />
      </span>
      <div>
        <h3 className="text-lg font-black text-ink">{title}</h3>
        {description && <p className="mt-1 max-w-md text-sm leading-6 text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={cn('skeleton-shimmer rounded-card', className)} aria-hidden="true" />
}

export function ErrorState({ message = 'Something went wrong.', action }) {
  return <EmptyState icon={AlertCircle} title="Unable to load" description={message} action={action} tone="danger" />
}
