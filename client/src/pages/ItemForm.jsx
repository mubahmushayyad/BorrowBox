import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemsAPI, CategoriesAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import { resolveImageUrl } from '../utils/media';
import { ALL_DAYS, WEEKDAYS } from '../utils/price';

const emptyForm = { title: '', description: '', categoryId: '', condition: 'good', maxDays: 3, pickupArea: '', imageUrl: '', gallery: [], pricePerDay: 0, chargeDays: ALL_DAYS };

export default function ItemForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    CategoriesAPI.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    ItemsAPI.get(id)
      .then((item) => {
        if (item.owner_id !== user.id && user.role !== 'admin') {
          navigate('/dashboard');
          return;
        }
        setForm({
          title: item.title,
          description: item.description || '',
          categoryId: item.category_id,
          condition: item.condition,
          maxDays: item.max_days,
          pickupArea: item.pickup_area || '',
          imageUrl: item.image_url || '',
          gallery: item.gallery || [],
          pricePerDay: Number(item.price_per_day) || 0,
          chargeDays: item.charge_days && item.charge_days.length ? item.charge_days : ALL_DAYS,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const { url } = await ItemsAPI.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGallerySelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const room = 10 - form.gallery.length;
    if (room <= 0) { setError('You can add up to 10 gallery photos'); return; }
    const picked = files.slice(0, room);
    if (picked.some((f) => f.size > 5 * 1024 * 1024)) { setError('Each image must be under 5 MB'); return; }
    setError('');
    setUploadingGallery(true);
    try {
      const urls = [];
      for (const f of picked) {
        const { url } = await ItemsAPI.uploadImage(f);
        urls.push(url);
      }
      setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryPhoto = (url) => setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }));

  const toggleDay = (day) => setForm((f) => ({
    ...f,
    chargeDays: f.chargeDays.includes(day) ? f.chargeDays.filter((d) => d !== day) : [...f.chargeDays, day],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const price = Number(form.pricePerDay) || 0;
      if (price > 0 && form.chargeDays.length === 0) {
        setError('Pick at least one day to charge for, or set the price to 0');
        setBusy(false);
        return;
      }
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        maxDays: Number(form.maxDays),
        pricePerDay: price,
        chargeDays: form.chargeDays,
        gallery: form.gallery,
      };
      if (isEdit) {
        await ItemsAPI.update(id, payload);
        showToast('Item updated');
      } else {
        const created = await ItemsAPI.create(payload);
        showToast('Item listed');
        navigate(`/items/${created.id}`);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page container"><Loading rows={4} /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="page-head">
          <div>
            <h1>{isEdit ? 'Edit item' : 'List an item'}</h1>
            <p className="page-sub">{isEdit ? 'Update the details borrowers see.' : 'Share a tool or gadget with your community.'}</p>
          </div>
        </div>
        <div className="card card-padded">
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" required value={form.title} onChange={update('title')} placeholder="Cordless Drill 18V" />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" value={form.description} onChange={update('description')} placeholder="What's included, condition notes, how to return it…" />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="category">Category</label>
                <select id="category" required value={form.categoryId} onChange={update('categoryId')}>
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="condition">Condition</label>
                <select id="condition" value={form.condition} onChange={update('condition')}>
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="maxDays">Max lending days</label>
                <input id="maxDays" type="number" min="1" required value={form.maxDays} onChange={update('maxDays')} />
              </div>
              <div className="field">
                <label htmlFor="pickupArea">Pickup area</label>
                <input id="pickupArea" value={form.pickupArea} onChange={update('pickupArea')} placeholder="Block B" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="pricePerDay">Price per day (Rs)</label>
              <input id="pricePerDay" type="number" min="0" step="1" value={form.pricePerDay} onChange={update('pricePerDay')} />
              <p className="field-hint">Enter 0 to lend for free.</p>
            </div>
            {Number(form.pricePerDay) > 0 && (
              <div className="field">
                <label>Days you want to charge for</label>
                <div className="day-picker">
                  {WEEKDAYS.map((d) => {
                    const on = form.chargeDays.includes(d.value);
                    return (
                      <label key={d.value} className={`day-chip${on ? ' on' : ''}`}>
                        <input type="checkbox" checked={on} onChange={() => toggleDay(d.value)} />
                        {d.label}
                      </label>
                    );
                  })}
                </div>
                <p className="field-hint">Only the selected weekdays are charged. A booking spanning other days is free for those days.</p>
              </div>
            )}
            <div className="field">
              <label>Main photo (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {form.imageUrl ? (
                <div className="flex-gap" style={{ alignItems: 'flex-start' }}>
                  <img
                    src={resolveImageUrl(form.imageUrl)}
                    alt="Item preview"
                    style={{ width: 112, height: 112, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  />
                  <div className="stack" style={{ gap: 8 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? 'Uploading…' : 'Replace photo'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}>
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : '📷 Upload a photo'}
                </button>
              )}
              <p className="field-hint">JPG, PNG, WEBP or GIF, up to 5 MB. Without one, a category icon is shown instead.</p>
            </div>
            <div className="field">
              <label>Photo gallery (optional)</label>
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleGallerySelect}
                style={{ display: 'none' }}
              />
              {form.gallery.length > 0 && (
                <div className="gallery-edit">
                  {form.gallery.map((url) => (
                    <div key={url} className="gallery-edit-item">
                      <img src={resolveImageUrl(url)} alt="Gallery preview" />
                      <button type="button" className="gallery-edit-remove" onClick={() => removeGalleryPhoto(url)} aria-label="Remove photo">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="btn btn-outline" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery || form.gallery.length >= 10}>
                {uploadingGallery ? 'Uploading…' : '🖼️ Add more photos'}
              </button>
              <p className="field-hint">Show the item from different angles. Up to 10 photos, 5 MB each.</p>
            </div>
            <button className="btn btn-primary btn-block" disabled={busy || uploading || uploadingGallery}>
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'List item'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
