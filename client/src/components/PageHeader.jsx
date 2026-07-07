export default function PageHeader({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <header className="page-heading reveal-item">
      <div className="page-heading__copy">
        <p className="eyebrow">{Icon && <Icon size={15} aria-hidden="true" />}{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-heading__actions">{actions}</div>}
    </header>
  )
}
