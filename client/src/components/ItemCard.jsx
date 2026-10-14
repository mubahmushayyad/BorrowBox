import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/media';
import { getCategoryIcon } from '../utils/categories';
import { formatPrice } from '../utils/price';

export default function ItemCard({ item }) {
  const icon = getCategoryIcon(item.category_name);
  const rating = Number(item.avg_rating || 0);

  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-thumb">
        {item.image_url ? (
          <img src={resolveImageUrl(item.image_url)} alt={item.title} loading="lazy" />
        ) : (
          <span className="item-thumb-icon" aria-hidden="true">{icon}</span>
        )}
        <span className="item-chip">{item.category_name}</span>
      </div>
      <div className="item-card-body">
        <h3>{item.title}</h3>
        <div className="item-meta">
          Up to {item.max_days} days · {Number(item.price_per_day) > 0 ? <span className="price-tag">{formatPrice(item.price_per_day)}/day</span> : 'Free'}
        </div>
        <div className="item-foot">
          <span className="item-rating">{rating > 0 ? <><b>★</b> {rating.toFixed(1)}</> : 'New lender'}</span>
          <span className="badge badge-secondary">Available</span>
        </div>
      </div>
    </Link>
  );
}
