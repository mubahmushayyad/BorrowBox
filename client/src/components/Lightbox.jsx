import { useCallback, useEffect } from 'react';

// Full-screen photo viewer. Esc closes, ←/→ move between photos, click the backdrop to close.
export default function Lightbox({ images, index, onClose, onChange, alt = '' }) {
  const count = images.length;
  const prev = useCallback(() => onChange((index - 1 + count) % count), [index, count, onChange]);
  const next = useCallback(() => onChange((index + 1) % count), [index, count, onChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) prev();
      else if (e.key === 'ArrowRight' && count > 1) next();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next, count]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close photo viewer">✕</button>
      {count > 1 && (
        <button type="button" className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous photo">‹</button>
      )}
      <img className="lightbox-img" src={images[index]} alt={`${alt} — photo ${index + 1} of ${count}`} onClick={(e) => e.stopPropagation()} />
      {count > 1 && (
        <button type="button" className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next photo">›</button>
      )}
      {count > 1 && <div className="lightbox-count">{index + 1} / {count}</div>}
    </div>
  );
}
