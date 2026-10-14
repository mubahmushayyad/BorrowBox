import { useState } from 'react';

export default function ConditionModal({ open, title, onCancel, onSubmit, busy }) {
  const [condition, setCondition] = useState('good');
  const [text, setText] = useState('');

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="field">
          <label>Item condition</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. one scratch on the handle" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSubmit({ condition, text })} disabled={busy}>
            {busy ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
