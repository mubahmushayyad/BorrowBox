export default function Loading({ rows = 3, variant = 'rows' }) {
  if (variant === 'cards') {
    return (
      <div className="skeleton-grid" aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    );
  }
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 76 }} />
      ))}
    </div>
  );
}
