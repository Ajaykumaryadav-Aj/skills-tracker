export default function StatCard({ label, value, detail, icon: Icon, tone = 'emerald', delay = 0 }) {
  return (
    <article className={`metric-card metric-card--${tone} reveal-item`} style={{ '--reveal-delay': `${delay}ms` }}>
      <div className="metric-card__topline">
        <span className="metric-card__label">{label}</span>
        {Icon && (
          <span className="metric-card__icon" aria-hidden="true">
            <Icon size={19} strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="metric-card__value">{value}</p>
      {detail && <p className="metric-card__detail">{detail}</p>}
      <span className="metric-card__accent" aria-hidden="true" />
    </article>
  )
}
