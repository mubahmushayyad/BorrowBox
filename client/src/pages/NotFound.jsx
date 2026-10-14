import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page container notfound">
      <p className="code" aria-hidden="true">404</p>
      <h1>This page doesn't exist</h1>
      <p className="muted">The link may be broken, or the page may have moved.</p>
      <Link to="/" className="btn btn-primary mt-2">Back to Browse</Link>
    </div>
  );
}
