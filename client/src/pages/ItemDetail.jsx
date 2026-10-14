import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ItemsAPI, BookingsAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import ItemGallery from '../components/ItemGallery';
import { computePrice, describeChargeDays, formatPrice } from '../utils/price';

function dayCount(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
}

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState({ start: '', end: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([ItemsAPI.get(id), ItemsAPI.availability(id)])
      .then(([i, avail]) => { setItem(i); setBookedRanges(avail); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <div className="page container"><Loading rows={3} /></div>;
  if (error) return <div className="page container"><ErrorBanner message={error} /></div>;
  if (!item) return null;

  const isOwner = user && user.id === item.owner_id;
  const days = dayCount(range.start, range.end);
  const overMax = days > item.max_days;
  const rate = Number(item.price_per_day) || 0;
  const { chargeableDays, total } = computePrice(range.start, range.end, rate, item.charge_days);

  const handleRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!user) return navigate('/login');
    if (!range.start || !range.end) { setFormError('Please choose your dates on the calendar'); return; }
    if (overMax) { setFormError(`Duration cannot exceed ${item.max_days} days`); return; }
    setSubmitting(true);
    try {
      await BookingsAPI.create({ itemId: item.id, startDate: range.start, endDate: range.end, message });
      showToast('Request sent to the owner');
      navigate('/dashboard?tab=borrowings');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Browse</Link> <span aria-hidden="true">/</span> <span>{item.category_name}</span> <span aria-hidden="true">/</span> <span aria-current="page">{item.title}</span>
        </nav>

        <div className="detail-grid">
          <div>
            <ItemGallery item={item} />

            <h1 className="detail-title">{item.title}</h1>
            <div className="flex-gap">
              <span className="badge badge-secondary">{item.category_name}</span>
              <span className="badge badge-beige">Condition: {item.condition}</span>
              <span className="badge badge-beige">Max {item.max_days} days</span>
              <span className="badge badge-secondary">{rate > 0 ? `${formatPrice(rate)} / day` : 'Free'}</span>
            </div>
            <p className="detail-desc">{item.description || 'No description provided.'}</p>

            <div className="owner-row mt-2">
              <div className="avatar">{item.owner_name?.[0]}</div>
              <div className="owner-info">
                <strong>{item.owner_name}</strong>
                <div className="muted" style={{ fontSize: '0.85rem' }}>Pickup area: {item.pickup_area || item.owner_area || '—'}</div>
              </div>
              <div className="rating-chip">
                {Number(item.owner_rating) > 0 ? <><span className="star-mark">★</span> {Number(item.owner_rating).toFixed(1)}</> : 'New'}
                <span className="muted" style={{ fontWeight: 400 }}>({item.owner_review_count} reviews)</span>
              </div>
              <Link to={`/profile/${item.owner_id}`} className="btn btn-outline btn-sm">View profile</Link>
            </div>
          </div>

          <div className="card card-padded booking-card">
            <h3 style={{ marginTop: 0 }}>Request to borrow</h3>
            <p className="muted" style={{ marginTop: -8 }}>Owner approval required · max {item.max_days} days</p>
            {rate > 0 && (
              <p className="muted" style={{ marginTop: -4 }}>
                <span className="price-tag">{formatPrice(rate)} per day</span> · charged on {describeChargeDays(item.charge_days)}
              </p>
            )}

            {isOwner ? (
              <div className="stack">
                <p className="muted">This is your own listing.</p>
                <Link to={`/items/${item.id}/edit`} className="btn btn-primary">Edit item</Link>
              </div>
            ) : (
              <form onSubmit={handleRequest}>
                <AvailabilityCalendar bookedRanges={bookedRanges} value={range} onChange={setRange} />

                <div className="field-row mt-2">
                  <div className="field">
                    <label>From</label>
                    <input type="date" value={range.start} readOnly />
                  </div>
                  <div className="field">
                    <label>To</label>
                    <input type="date" value={range.end} readOnly />
                  </div>
                </div>

                {days > 0 && (
                  <p className={overMax ? 'field-hint' : 'field-hint'} style={overMax ? { color: 'var(--color-danger)' } : undefined}>
                    {overMax ? `⚠ ${days} days selected — max ${item.max_days} allowed` : `✓ ${days} day${days > 1 ? 's' : ''} selected (max ${item.max_days} allowed)`}
                  </p>
                )}

                {days > 0 && !overMax && (
                  <div className="price-box" aria-live="polite">
                    {rate > 0 ? (
                      <>
                        <div className="price-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          {chargeableDays} charged day{chargeableDays === 1 ? '' : 's'} × {formatPrice(rate)}
                          {chargeableDays < days ? ` (${days - chargeableDays} day${days - chargeableDays === 1 ? '' : 's'} free)` : ''}
                        </div>
                      </>
                    ) : (
                      <div className="price-total"><span>Total</span><strong>Free</strong></div>
                    )}
                  </div>
                )}

                <div className="field">
                  <label>Message to owner</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, I'd like to borrow this for…" />
                </div>

                <ErrorBanner message={formError} />
                <button className="btn btn-primary btn-block" disabled={submitting || overMax}>
                  {submitting ? 'Sending…' : user ? 'Send request' : 'Log in to send a request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
