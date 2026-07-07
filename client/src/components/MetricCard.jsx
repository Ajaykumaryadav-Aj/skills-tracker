export default function MetricCard({ label, value, detail, icon: Icon, tone = 'emerald', progress, delay = 0 }) {
  const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0))

  return (
    <article className={`metric-card metric-card--${tone} reveal-item`} style={{ '--reveal-delay': `${delay}ms` }}>
      <div className="metric-card__topline">
        <span className="metric-card__label">{label}</span>
        {Icon && <span className="metric-card__icon" aria-hidden="true"><Icon size={19} /></span>}
      </div>
      <p className="metric-card__value">{value}</p>
      {detail && <p className="metric-card__detail">{detail}</p>}
      <span className="metric-card__accent" style={{ '--metric-progress': `${safeProgress}%` }} aria-hidden="true" />
    </article>
  )
}
