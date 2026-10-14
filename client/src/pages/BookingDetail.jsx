import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookingsAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import { formatPrice } from '../utils/price';

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    BookingsAPI.get(id).then(setBooking).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page container"><Loading rows={3} /></div>;
  if (error) return <div className="page container"><ErrorBanner message={error} /></div>;
  if (!booking) return null;

  const isOwner = user?.id === booking.owner_id;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/dashboard">Dashboard</Link> <span aria-hidden="true">/</span> <span aria-current="page">Booking #{booking.id}</span></nav>
        <div className="card card-padded">
          <div className="flex-between">
            <h2 style={{ margin: 0 }}>
              <Link to={`/items/${booking.item_id}`}>{booking.item_title}</Link>
            </h2>
            <StatusBadge status={booking.status} overdue={booking.is_overdue} />
          </div>

          <div className="stat-grid stat-grid-3 mt-2">
            <div className="card stat-card">
              <div className="num" style={{ fontSize: '1.15rem' }}>{booking.start_date?.slice(0, 10)}</div>
              <div className="label">Start date</div>
            </div>
            <div className="card stat-card">
              <div className="num" style={{ fontSize: '1.15rem' }}>{booking.end_date?.slice(0, 10)}</div>
              <div className="label">End date</div>
            </div>
            <div className="card stat-card">
              <div className="num" style={{ fontSize: '1.15rem' }}>{isOwner ? booking.borrower_name : booking.owner_name}</div>
              <div className="label">{isOwner ? 'Borrower' : 'Owner'}</div>
            </div>
          </div>

          <div className="price-box">
            <div className="price-total">
              <span>{isOwner ? 'You will charge' : 'Total to pay'}</span>
              <strong>{Number(booking.total_price) > 0 ? formatPrice(booking.total_price) : 'Free'}</strong>
            </div>
            {Number(booking.total_price) > 0 && (
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {booking.chargeable_days} charged day{booking.chargeable_days === 1 ? '' : 's'} × {formatPrice(booking.price_per_day)}
              </div>
            )}
          </div>

          {booking.message && (
            <div className="mt-2">
              <h3>Message</h3>
              <p className="muted">"{booking.message}"</p>
            </div>
          )}

          {booking.reject_reason && (
            <div className="mt-2">
              <h3>Reject reason</h3>
              <p className="muted">{booking.reject_reason}</p>
            </div>
          )}

          {booking.conditionLogs?.length > 0 && (
            <div className="mt-3">
              <h3>Condition log</h3>
              <div className="stack">
                {booking.conditionLogs.map((log) => (
                  <div key={log.id} className="list-row" style={{ margin: 0 }}>
                    <div className="list-row-icon">{log.stage === 'handover' ? '📤' : '📥'}</div>
                    <div className="list-row-main">
                      <strong>{log.stage === 'handover' ? 'Handover' : 'Return'}</strong> — condition: {log.condition}
                      {log.note && <div className="muted" style={{ fontSize: '0.85rem' }}>{log.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {booking.reviews?.length > 0 && (
            <div className="mt-3">
              <h3>Reviews</h3>
              <div className="stack">
                {booking.reviews.map((r) => (
                  <div key={r.id} className="list-row" style={{ margin: 0 }}>
                    <div className="list-row-icon">★</div>
                    <div className="list-row-main">
                      <strong>{r.reviewer_name}</strong> rated {r.rating}/5
                      {r.comment && <div className="muted" style={{ fontSize: '0.85rem' }}>"{r.comment}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
