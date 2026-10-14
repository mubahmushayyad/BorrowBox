import { useState } from 'react';
import Lightbox from './Lightbox';
import { resolveImageUrl } from '../utils/media';
import { getCategoryIcon } from '../utils/categories';

// Main photo + optional thumbnail strip. Clicking the main photo opens it full screen.
export default function ItemGallery({ item }) {
  const urls = [item.image_url, ...(item.gallery || [])].filter(Boolean).map(resolveImageUrl);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  if (urls.length === 0) {
    return <div className="detail-hero">{getCategoryIcon(item.category_name)}</div>;
  }

  return (
    <>
      <button type="button" className="detail-hero detail-hero-btn" onClick={() => setOpen(true)} aria-label="Open photo full screen">
        <img className="detail-bg" src={urls[active]} alt="" aria-hidden="true" />
        <img className="detail-img" src={urls[active]} alt={item.title} />
        <span className="zoom-hint" aria-hidden="true">🔍 Click to enlarge</span>
      </button>

      {urls.length > 1 && (
        <div className="thumb-strip" role="list" aria-label="More photos of this item">
          {urls.map((u, i) => (
            <button
              key={u + i}
              type="button"
              role="listitem"
              className={`thumb${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
            >
              <img src={u} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {open && <Lightbox images={urls} index={active} onChange={setActive} onClose={() => setOpen(false)} alt={item.title} />}
    </>
  );
}
