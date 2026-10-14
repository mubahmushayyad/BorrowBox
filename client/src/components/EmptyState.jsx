export default function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {subtitle && <p className="muted">{subtitle}</p>}
      {action}
    </div>
  );
}
