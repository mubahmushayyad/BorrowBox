import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UsersAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import StarRating from '../components/StarRating';

export default function Profile() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', area: '' });
  const [busy, setBusy] = useState(false);

  const isMe = user && String(user.id) === String(id);

  const load = () => {
    setLoading(true);
    UsersAPI.publicProfile(id)
      .then((p) => { setProfile(p); setForm({ name: p.name, phone: user?.phone || '', area: p.area || '' }); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await UsersAPI.updateMe(form);
      updateUser(updated);
      showToast('Profile updated');
      setEditing(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page container"><Loading rows={3} /></div>;
  if (error) return <div className="page container"><ErrorBanner message={error} /></div>;
  if (!profile) return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="card profile-card">
          <div className="profile-banner" aria-hidden="true" />
          <div className="profile-body">
          <div className="profile-top">
            <div className="profile-id">
              <div className="avatar" style={{ width: 76, height: 76, fontSize: '1.5rem' }}>
                {profile.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <h2>{profile.name}</h2>
                <div className="muted">{profile.area || 'Area not set'} · Member since {new Date(profile.created_at).getFullYear()}</div>
              </div>
            </div>
            {isMe && <button className="btn btn-outline btn-sm" onClick={() => setEditing((v) => !v)}>{editing ? 'Cancel' : 'Edit profile'}</button>}
          </div>

          <div className="trust">
            <span className="rating-chip"><span className="star-mark">★</span> {profile.trustScore}</span>
            <span className="muted">({profile.reviewCount} review{profile.reviewCount === 1 ? '' : 's'})</span>
          </div>

          {editing && (
            <form onSubmit={handleSave} className="mt-3">
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="field">
                  <label>Area</label>
                  <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </form>
          )}
          </div>
        </div>

        <h3 className="mt-3">Reviews</h3>
        {profile.reviews.length === 0 ? (
          <EmptyState icon="⭐" title="No reviews yet" subtitle="Reviews appear here after completed bookings." />
        ) : (
          <div className="stack">
            {profile.reviews.map((r) => (
              <div key={r.id} className="card card-padded">
                <div className="flex-between">
                  <strong>{r.reviewer_name}</strong>
                  <StarRating value={r.rating} readOnly size="1rem" />
                </div>
                {r.comment && <p className="muted mt-1" style={{ marginBottom: 0 }}>"{r.comment}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
