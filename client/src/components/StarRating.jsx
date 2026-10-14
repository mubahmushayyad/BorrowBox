export default function StarRating({ value = 0, onChange, readOnly = false, size }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="star-input" style={size ? { fontSize: size } : undefined}>
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
          role={readOnly ? undefined : 'button'}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
