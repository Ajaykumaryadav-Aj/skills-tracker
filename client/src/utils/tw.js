export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const ui = {
  panel: 'rounded-panel border border-line bg-surface/95 p-5 shadow-card backdrop-blur sm:p-6',
  card: 'rounded-panel border border-line bg-surface/95 shadow-card backdrop-blur transition duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover focus-within:border-emerald-brand/40',
  button: {
    base: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-card border px-4 py-2 text-sm font-extrabold leading-none shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-brand/20 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60',
    primary: 'border-emerald-brand bg-emerald-brand text-white hover:border-emerald-brand hover:bg-emerald-brand hover:brightness-105',
    secondary: 'border-line-strong bg-white text-ink hover:border-emerald-brand hover:bg-emerald-pale hover:text-emerald-dark-brand',
    danger: 'border-coral bg-coral text-white hover:border-coral-dark hover:bg-coral-dark',
    icon: 'inline-flex min-h-9 min-w-9 items-center justify-center rounded-card border border-line bg-white px-2 text-ink shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-brand hover:bg-emerald-pale hover:text-emerald-dark-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-brand/20',
  },
  field: {
    label: 'mb-1.5 block text-sm font-extrabold text-ink',
    help: 'mt-1.5 text-xs font-medium leading-5 text-ink-muted',
    control: 'flex min-h-11 items-center gap-2 rounded-card border border-line bg-white px-3 shadow-xs transition duration-200 focus-within:border-emerald-brand focus-within:ring-4 focus-within:ring-emerald-brand/10',
    input: 'w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none',
    error: 'mt-1.5 text-sm font-semibold text-red-700',
  },
  badge: {
    base: 'inline-flex min-h-7 w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold',
    idle: 'border-line bg-surface-raised text-ink-soft',
    active: 'border-emerald-brand/20 bg-emerald-pale text-emerald-dark-brand',
    revision: 'border-sun/40 bg-sun-pale text-yellow-800',
    complete: 'border-blue-brand/20 bg-blue-pale text-blue-brand',
    danger: 'border-coral/20 bg-coral-pale text-coral-dark',
  },
  empty: 'grid min-h-48 place-items-center gap-3 rounded-panel border border-dashed border-line-strong bg-surface-raised/90 p-8 text-center text-ink-soft',
  table: {
    wrap: 'max-w-full overflow-x-auto rounded-card',
    table: 'w-full border-separate border-spacing-0 text-left text-sm',
    th: 'whitespace-nowrap border-b border-line bg-surface-raised px-4 py-3 text-xs font-black uppercase text-ink-soft',
    td: 'whitespace-nowrap border-b border-line px-4 py-3 align-middle text-ink',
  },
}

export const statusTone = (status) => ({
  'Not Started': ui.badge.idle,
  Learning: ui.badge.active,
  Study: ui.badge.active,
  Practice: ui.badge.active,
  Revision: ui.badge.revision,
  Paused: ui.badge.revision,
  Snoozed: ui.badge.revision,
  Completed: ui.badge.complete,
  Complete: ui.badge.complete,
  Project: ui.badge.complete,
  Skipped: ui.badge.danger,
  Missed: ui.badge.danger,
  High: ui.badge.danger,
  Medium: ui.badge.revision,
  Low: ui.badge.active,
}[status] || ui.badge.idle)
