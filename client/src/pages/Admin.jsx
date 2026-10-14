import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminAPI, CategoriesAPI, ItemsAPI } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { resolveImageUrl } from '../utils/media';

const TABS = [
  { key: 'stats', label: 'Statistics' },
  { key: 'items', label: 'Items' },
  { key: 'users', label: 'Users' },
  { key: 'categories', label: 'Categories' },
];

export default function Admin() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('stats');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [renaming, setRenaming] = useState(null); // {id, name}
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const loadAll = () => {
    setLoading(true);
    setError('');
    Promise.all([AdminAPI.stats(), AdminAPI.users(), CategoriesAPI.list(), AdminAPI.items()])
      .then(([s, u, c, i]) => { setStats(s); setUsers(u); setCategories(c); setItems(i); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const toggleUser = async (u) => {
    setBusy(true);
    try {
      await AdminAPI.setUserStatus(u.id, !u.is_active);
      showToast(u.is_active ? 'User deactivated' : 'User activated');
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setBusy(true);
    try {
      await CategoriesAPI.create({ name: newCategory.trim() });
      showToast('Category added');
      setNewCategory('');
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async () => {
    if (!renaming?.name.trim()) return;
    setBusy(true);
    try {
      await CategoriesAPI.update(renaming.id, { name: renaming.name.trim() });
      showToast('Category renamed');
      setRenaming(null);
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteItem = async () => {
    setBusy(true);
    try {
      const res = await ItemsAPI.remove(deleteItem.id);
      showToast(res.message);
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
      setDeleteItem(null);
    }
  };

  const confirmDeleteCategory = async () => {
    setBusy(true);
    try {
      await CategoriesAPI.remove(deleteCategory.id);
      showToast('Category deleted');
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
      setDeleteCategory(null);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Admin panel</h1>
            <p className="page-sub">Oversee members, listings and categories across BorrowBox.</p>
          </div>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? <Loading rows={4} /> : (
          <>
            {tab === 'stats' && stats && (
              <>
                <div className="stat-grid">
                  <div className="card stat-card">
                    <div className="num">{stats.totalUsers}</div>
                    <div className="label">Total users</div>
                  </div>
                  <div className="card stat-card">
                    <div className="num">{stats.totalItems}</div>
                    <div className="label">Total items</div>
                  </div>
                  <div className="card stat-card">
                    <div className="num">{stats.totalBookings}</div>
                    <div className="label">Total bookings</div>
                  </div>
                </div>
                <h3>Bookings by status</h3>
                <div className="stat-grid">
                  {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
                    <div key={status} className="card stat-card">
                      <div className="num" style={{ fontSize: '1.4rem' }}>{count}</div>
                      <div className="label">{status}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'users' && (
              <div className="stack">
                {users.map((u) => (
                  <div key={u.id} className="list-row">
                    <div className="list-row-icon">{u.role === 'admin' ? '🛡️' : '👤'}</div>
                    <div className="list-row-main">
                      <strong>{u.name}</strong> <span className="muted">({u.email})</span>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        {u.role} · {u.area || 'no area'} · joined {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`badge ${u.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                    {u.role !== 'admin' && (
                      <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`} disabled={busy} onClick={() => toggleUser(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'items' && (
              <>
                <div className="flex-between mb-2">
                  <p className="muted" style={{ margin: 0 }}>{items.length} item{items.length === 1 ? '' : 's'} across all members</p>
                  <Link to="/items/new" className="btn btn-primary btn-sm">+ Add item</Link>
                </div>
                {items.length === 0 ? (
                  <EmptyState icon="📦" title="No items yet" subtitle="Add the first item to get the platform started."
                    action={<Link to="/items/new" className="btn btn-primary mt-2">Add item</Link>} />
                ) : (
                  <div className="stack">
                    {items.map((it) => (
                      <div key={it.id} className="list-row">
                        <div className="list-row-icon" style={{ padding: 0, overflow: 'hidden' }}>
                          {it.image_url ? (
                            <img src={resolveImageUrl(it.image_url)} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : '📦'}
                        </div>
                        <div className="list-row-main">
                          <Link to={`/items/${it.id}`}><strong>{it.title}</strong></Link>
                          <div className="muted" style={{ fontSize: '0.85rem' }}>
                            {it.category_name} · owned by {it.owner_name} · {it.is_active ? 'Active' : 'Deactivated'}
                          </div>
                        </div>
                        <div className="row-actions">
                          <Link to={`/items/${it.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteItem(it)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'categories' && (
              <>
                <form onSubmit={addCategory} className="flex-gap mb-2">
                  <input className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" style={{ flex: 1, minWidth: 0 }} />
                  <button className="btn btn-primary" disabled={busy}>Add</button>
                </form>
                <div className="stack">
                  {categories.map((c) => (
                    <div key={c.id} className="list-row">
                      <div className="list-row-icon">🏷️</div>
                      <div className="list-row-main">
                        {renaming?.id === c.id ? (
                          <input className="input" value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                            style={{ minHeight: 40 }} />
                        ) : (
                          <strong>{c.name}</strong>
                        )}
                      </div>
                      {renaming?.id === c.id ? (
                        <div className="row-actions">
                          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={saveRename}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setRenaming({ id: c.id, name: c.name })}>Rename</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteCategory(c)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteItem)}
        title="Delete item?"
        body={`This will remove "${deleteItem?.title}". If it has booking history, it will be deactivated instead.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setDeleteItem(null)}
        onConfirm={confirmDeleteItem}
      />

      <ConfirmModal
        open={Boolean(deleteCategory)}
        title="Delete category?"
        body={`Delete "${deleteCategory?.name}"? This is blocked if any item still uses it.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setDeleteCategory(null)}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}
