import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../utils/tw'

const labelMap = {
  dashboard: 'Dashboard',
  skills: 'Skills',
  roadmaps: 'Roadmaps',
  logs: 'Learning logs',
  revisions: 'Revisions',
  notes: 'Notes',
  ai: 'AI Assistant',
  profile: 'Profile',
  new: 'New',
  edit: 'Edit',
  templates: 'Templates',
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs = segments.slice(0, 3).map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const label = labelMap[segment] || (segment.length > 14 ? 'Details' : segment.replace(/-/g, ' '))
    return { href, label, current: index === segments.length - 1 || index === 2 }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex min-w-0 flex-wrap items-center gap-1 text-xs font-bold text-ink-muted">
      <Link to="/" className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-emerald-pale hover:text-emerald-dark-brand">
        <Home size={13} /> Home
      </Link>
      {crumbs.map((crumb) => (
        <span className="inline-flex min-w-0 items-center gap-1" key={crumb.href}>
          <ChevronRight size={13} aria-hidden="true" />
          {crumb.current ? (
            <span className="max-w-36 truncate rounded-full bg-surface-raised px-2 py-1 capitalize text-ink-soft">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="max-w-36 truncate rounded-full px-2 py-1 capitalize transition hover:bg-emerald-pale hover:text-emerald-dark-brand">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export default function PageHeader({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <header className="reveal-item mb-6 overflow-hidden rounded-panel border border-line bg-white/80 p-5 shadow-card backdrop-blur sm:p-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-normal text-emerald-dark-brand">
            {Icon && <Icon size={15} aria-hidden="true" />}{eyebrow}
          </p>
          <h1 className="max-w-[900px] text-balance text-3xl font-black leading-tight text-ink sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-[760px] text-sm leading-6 text-ink-soft">{description}</p>}
        </div>
        {actions && <div className={cn('flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end')}>{actions}</div>}
      </div>
    </header>
  )
}
