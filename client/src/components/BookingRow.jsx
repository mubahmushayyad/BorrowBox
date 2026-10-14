import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatPrice } from '../utils/price';

export default function BookingRow({ booking, perspective, onAction, onReview, onDelete }) {
  const b = booking;
  const otherParty = perspective === 'owner' ? b.borrower_name : b.owner_name;
  const roleLabel = perspective === 'owner' ? 'Requested by' : 'Owner';

  return (
    <div className="list-row">
      <div className="list-row-icon">📦</div>
      <div className="list-row-main">
        <div className="flex-gap">
          <Link to={`/items/${b.item_id}`}><strong>{b.item_title}</strong></Link>
          <StatusBadge status={b.status} overdue={b.is_overdue} />
        </div>
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          {roleLabel}: {otherParty} · {b.start_date?.slice(0, 10)} → {b.end_date?.slice(0, 10)}
          {Number(b.total_price) > 0 && <> · <span className="price-tag">{formatPrice(b.total_price)}</span></>}
        </div>
        {b.message && <div className="muted" style={{ fontSize: '0.85rem' }}>"{b.message}"</div>}
      </div>

      <div className="row-actions">
        {perspective === 'owner' && b.status === 'REQUESTED' && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onAction(b, 'approve')}>Approve</button>
            <button className="btn btn-outline btn-sm" onClick={() => onAction(b, 'reject')}>Reject</button>
          </>
        )}
        {perspective === 'owner' && b.status === 'APPROVED' && (
          <button className="btn btn-secondary btn-sm" onClick={() => onAction(b, 'pickup')}>Mark picked up</button>
        )}
        {perspective === 'owner' && b.status === 'PICKED_UP' && (
          <button className="btn btn-secondary btn-sm" onClick={() => onAction(b, 'return')}>Mark returned</button>
        )}

        {perspective === 'borrower' && ['REQUESTED', 'APPROVED'].includes(b.status) && (
          <button className="btn btn-outline btn-sm" onClick={() => onAction(b, 'cancel')}>Cancel</button>
        )}

        {b.status === 'RETURNED' && onReview && (
          <button className="btn btn-secondary btn-sm" onClick={() => onReview(b)}>Rate</button>
        )}

        {['REJECTED', 'CANCELLED'].includes(b.status) && onDelete && (
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(b)}>Remove</button>
        )}

        <Link to={`/bookings/${b.id}`} className="btn btn-ghost btn-sm">Details</Link>
      </div>
    </div>
  );
}
