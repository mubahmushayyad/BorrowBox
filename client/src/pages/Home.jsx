import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ItemsAPI, CategoriesAPI } from '../api/endpoints';
import ItemCard from '../components/ItemCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { getCategoryIcon } from '../utils/categories';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState(params.get('search') || '');
  const [from, setFrom] = useState(params.get('from') || '');
  const [to, setTo] = useState(params.get('to') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [condition, setCondition] = useState(params.get('condition') || '');
  const [sort, setSort] = useState(params.get('sort') || '');

  useEffect(() => {
    CategoriesAPI.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const page = params.get('page') || '1';
    setLoading(true);
    setError('');
    ItemsAPI.list({
      search: params.get('search') || undefined,
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
      category: params.get('category') || undefined,
      condition: params.get('condition') || undefined,
      sort: params.get('sort') || undefined,
      page,
    })
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params]);

  const applyFilters = (overrides = {}) => {
    const next = new URLSearchParams();
    const values = { search, from, to, category, condition, sort, page: '1', ...overrides };
    Object.entries(values).forEach(([k, v]) => { if (v) next.set(k, v); });
    setParams(next);
  };

  const clearFilters = () => {
    setSearch(''); setFrom(''); setTo(''); setCategory(''); setCondition(''); setSort('');
    setParams({});
  };

  const goToPage = (p) => applyFilters({ page: String(p) });

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Borrow what you need. Lend what you don't.</h1>
            <p className="hero-lead">
              Search your community's tools and gadgets, check date-wise availability, and send a request in seconds.
            </p>
          </div>

          <aside className="hero-track" aria-label="How lending works">
            <h2>Every loan, tracked end to end</h2>
            <ol className="track">
              <li style={{ '--dot': '#F7E6B5' }}>
                <div>
                  <div className="track-title"><strong>Request</strong><span className="badge badge-requested">Requested</span></div>
                  <p>Pick dates on the live calendar and message the owner.</p>
                </div>
              </li>
              <li style={{ '--dot': '#86C69A' }}>
                <div>
                  <div className="track-title"><strong>Approve</strong><span className="badge badge-approved">Approved</span></div>
                  <p>The owner reviews your request and confirms.</p>
                </div>
              </li>
              <li style={{ '--dot': '#D3E0F7' }}>
                <div>
                  <div className="track-title"><strong>Pick up</strong><span className="badge badge-picked_up">Picked up</span></div>
                  <p>The item's condition is logged at handover.</p>
                </div>
              </li>
              <li style={{ '--dot': '#FFFFFF' }}>
                <div>
                  <div className="track-title"><strong>Return &amp; review</strong><span className="badge badge-returned">Returned</span></div>
                  <p>Condition is logged again, then you rate each other.</p>
                </div>
              </li>
            </ol>
          </aside>
        </div>

        <div className="container search-wrap">
          <form className="search-bar" onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
            <label className="sb-field sb-grow">
              <span>What do you need?</span>
              <input
                className="search-input"
                placeholder="Search tools & gadgets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="sb-field">
              <span>From</span>
              <input className="search-date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
            </label>
            <label className="sb-field">
              <span>To</span>
              <input className="search-date" type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
            </label>
            <label className="sb-field">
              <span>Category</span>
              <select className="search-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <button className="btn btn-primary btn-search" type="submit">Search</button>
          </form>

          {categories.length > 0 && (
            <div className="chip-row" role="group" aria-label="Quick category filter">
              <button
                type="button"
                className={`chip ${!category ? 'active' : ''}`}
                aria-pressed={!category}
                onClick={() => { setCategory(''); applyFilters({ category: '' }); }}
              >
                All items
              </button>
              {categories.map((c) => {
                const active = String(category) === String(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${active ? 'active' : ''}`}
                    aria-pressed={active}
                    onClick={() => { setCategory(String(c.id)); applyFilters({ category: String(c.id) }); }}
                  >
                    <span aria-hidden="true">{getCategoryIcon(c.name)}</span> {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="page">
        <div className="container layout-with-sidebar">
          <aside className="card filters" aria-label="Filters">
            <h3 className="filters-title">Filters</h3>
            <div className="filters-body">
              <div className="filter-group">
                <h4>Condition</h4>
                <div className="filter-options">
                  {['', 'new', 'good', 'fair'].map((c) => (
                    <label key={c || 'any'} className="filter-option">
                      <input type="radio" name="condition" checked={condition === c}
                        onChange={() => { setCondition(c); applyFilters({ condition: c }); }} />
                      <span>{c ? c[0].toUpperCase() + c.slice(1) : 'Any'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <h4>Sort by</h4>
                <select value={sort} onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}>
                  <option value="">Newest first</option>
                  <option value="rating">Top rated owners</option>
                </select>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
          </aside>

          <div>
            <div className="results-head">
              <h2>{result.total} item{result.total === 1 ? '' : 's'} found</h2>
            </div>

            {error && <EmptyState icon="⚠️" title="Couldn't load items" subtitle={error} />}
            {!error && loading && <Loading rows={6} variant="cards" />}
            {!error && !loading && result.items.length === 0 && (
              <EmptyState icon="🔍" title="No items found" subtitle="Try a different search or clear your filters." />
            )}
            {!error && !loading && result.items.length > 0 && (
              <>
                <div className="item-grid">
                  {result.items.map((item) => <ItemCard key={item.id} item={item} />)}
                </div>
                {result.totalPages > 1 && (
                  <div className="pagination">
                    <button disabled={result.page <= 1} onClick={() => goToPage(result.page - 1)} aria-label="Previous page">‹</button>
                    {Array.from({ length: result.totalPages }).map((_, i) => (
                      <button key={i} className={result.page === i + 1 ? 'active' : ''} onClick={() => goToPage(i + 1)}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={result.page >= result.totalPages} onClick={() => goToPage(result.page + 1)} aria-label="Next page">›</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
