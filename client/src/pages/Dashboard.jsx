import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ItemsAPI, BookingsAPI } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import BookingRow from '../components/BookingRow';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';
import ConditionModal from '../components/ConditionModal';
import { resolveImageUrl } from '../utils/media';

const TABS = [
  { key: 'items', label: 'My Items' },
  { key: 'borrowings', label: 'My Borrowings' },
  { key: 'incoming', label: 'Incoming Requests' },
];

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'items';
  const { showToast } = useToast();

  const [myItems, setMyItems] = useState([]);
  const [myBorrowings, setMyBorrowings] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmItem, setConfirmItem] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [conditionAction, setConditionAction] = useState(null); // { booking, action }
  const [deleteBooking, setDeleteBooking] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError('');
    Promise.all([ItemsAPI.mine(), BookingsAPI.mine(), BookingsAPI.incoming()])
      .then(([items, mine, inc]) => { setMyItems(items); setMyBorrowings(mine); setIncoming(inc); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const setTab = (key) => setParams({ tab: key });

  const handleDeleteItem = async () => {
    if (!confirmItem) return;
    setBusy(true);
    try {
      const res = await ItemsAPI.remove(confirmItem.id);
      showToast(res.message);
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
      setConfirmItem(null);
    }
  };

  const handleBookingAction = async (booking, action) => {
    if (action === 'pickup' || action === 'return') {
      setConditionAction({ booking, action });
      return;
    }
    try {
      await BookingsAPI.changeStatus(booking.id, { action });
      showToast(`Booking ${action}d`);
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const submitConditionAction = async (note) => {
    setBusy(true);
    try {
      await BookingsAPI.changeStatus(conditionAction.booking.id, { action: conditionAction.action, note });
      showToast(conditionAction.action === 'pickup' ? 'Marked as picked up' : 'Marked as returned');
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
      setConditionAction(null);
    }
  };

  const submitReview = async ({ rating, comment }) => {
    setBusy(true);
    try {
      await BookingsAPI.review(reviewBooking.id, { rating, comment });
      showToast('Thanks for your review!');
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
      setReviewBooking(null);
    }
  };

  const confirmDeleteBooking = async () => {
    setBusy(true);
    try {
      await BookingsAPI.remove(deleteBooking.id);
      showToast('Booking removed');
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
      setDeleteBooking(null);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Dashboard</h1>
            <p className="page-sub">Manage your listings, your borrowings and the requests you've received.</p>
          </div>
          <Link to="/items/new" className="btn btn-primary">List an item</Link>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              {t.key === 'incoming' && incoming.filter((b) => b.status === 'REQUESTED').length > 0 && (
                <span className="badge badge-requested" style={{ marginLeft: 8 }}>
                  {incoming.filter((b) => b.status === 'REQUESTED').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? <Loading rows={4} /> : (
          <>
            {tab === 'items' && (
              myItems.length === 0 ? (
                <EmptyState icon="📦" title="No items listed yet" subtitle="List a tool or gadget others can borrow."
                  action={<Link to="/items/new" className="btn btn-primary mt-2">List an item</Link>} />
              ) : (
                <div className="stack">
                  {myItems.map((item) => (
                    <div key={item.id} className="list-row">
                      <div className="list-row-icon">
                        {item.image_url ? <img src={resolveImageUrl(item.image_url)} alt="" /> : '📦'}
                      </div>
                      <div className="list-row-main">
                        <Link to={`/items/${item.id}`}><strong>{item.title}</strong></Link>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          {item.category_name} · max {item.max_days} days · {Number(item.price_per_day) > 0 ? `Rs ${Number(item.price_per_day)}/day` : 'Free'} · {item.is_active ? 'Active' : 'Deactivated'}
                        </div>
                      </div>
                      <div className="row-actions">
                        <Link to={`/items/${item.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem(item)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'borrowings' && (
              myBorrowings.length === 0 ? (
                <EmptyState icon="🤝" title="You haven't borrowed anything yet" subtitle="Browse the community's items to get started."
                  action={<Link to="/" className="btn btn-primary mt-2">Browse items</Link>} />
              ) : (
                <div className="stack">
                  {myBorrowings.map((b) => (
                    <BookingRow key={b.id} booking={b} perspective="borrower"
                      onAction={handleBookingAction} onReview={(bk) => setReviewBooking(bk)} onDelete={(bk) => setDeleteBooking(bk)} />
                  ))}
                </div>
              )
            )}

            {tab === 'incoming' && (
              incoming.length === 0 ? (
                <EmptyState icon="📥" title="No requests yet" subtitle="Requests from borrowers will show up here." />
              ) : (
                <div className="stack">
                  {incoming.map((b) => (
                    <BookingRow key={b.id} booking={b} perspective="owner" onAction={handleBookingAction} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirmItem)}
        title="Delete item?"
        body={`This will remove "${confirmItem?.title}". If it has booking history, it will be deactivated instead.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleDeleteItem}
      />

      <ConfirmModal
        open={Boolean(deleteBooking)}
        title="Remove booking?"
        body="This will permanently remove this booking record."
        confirmLabel="Remove"
        danger
        busy={busy}
        onCancel={() => setDeleteBooking(null)}
        onConfirm={confirmDeleteBooking}
      />

      <ReviewModal open={Boolean(reviewBooking)} busy={busy} onCancel={() => setReviewBooking(null)} onSubmit={submitReview} />

      <ConditionModal
        open={Boolean(conditionAction)}
        title={conditionAction?.action === 'pickup' ? 'Mark as picked up' : 'Mark as returned'}
        busy={busy}
        onCancel={() => setConditionAction(null)}
        onSubmit={submitConditionAction}
      />
    </div>
  );
}
