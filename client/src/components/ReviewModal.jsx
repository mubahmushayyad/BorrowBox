import { useState } from 'react';
import StarRating from './StarRating';

export default function ReviewModal({ open, onCancel, onSubmit, busy }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Rate this booking</h3>
        <p className="muted">Your rating helps build trust in the community.</p>
        <StarRating value={rating} onChange={setRating} size="2rem" />
        <div className="field mt-2">
          <label>Comment (optional)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did it go?" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSubmit({ rating, comment })} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}
