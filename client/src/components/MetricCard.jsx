import { cn, ui } from '../utils/tw'

const toneClasses = {
  emerald: 'before:bg-emerald-brand [&_.metric-icon]:bg-emerald-pale [&_.metric-icon]:text-emerald-dark-brand',
  coral: 'before:bg-coral [&_.metric-icon]:bg-coral-pale [&_.metric-icon]:text-coral-dark',
  sun: 'before:bg-sun [&_.metric-icon]:bg-sun-pale [&_.metric-icon]:text-yellow-800',
  blue: 'before:bg-blue-brand [&_.metric-icon]:bg-blue-pale [&_.metric-icon]:text-blue-brand',
}

export default function MetricCard({ label, value, detail, icon: Icon, tone = 'emerald', progress, delay = 0 }) {
  const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0))

  return (
    <article
      className={cn(
        ui.card,
        'reveal-item relative min-h-36 overflow-hidden p-5 before:absolute before:inset-x-0 before:bottom-0 before:h-1 after:absolute after:-right-8 after:-top-10 after:size-28 after:rounded-full after:bg-current after:opacity-[0.04]',
        toneClasses[tone] || toneClasses.emerald,
      )}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs font-extrabold uppercase tracking-normal text-ink-soft">{label}</span>
        {Icon && <span className="metric-icon grid size-10 place-items-center rounded-card ring-1 ring-current/10" aria-hidden="true"><Icon size={19} /></span>}
      </div>
      <p className="mt-4 text-3xl font-black leading-none text-ink">{value}</p>
      {detail && <p className="mt-2 text-sm leading-6 text-ink-soft">{detail}</p>}
      <span className="absolute bottom-0 left-0 h-1 bg-current opacity-80 transition-all duration-700" style={{ width: `${safeProgress}%` }} aria-hidden="true" />
    </article>
  )
}
