import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark">B</span>
              BorrowBox
            </Link>
            <p className="footer-blurb">Lend it. Borrow it. Track it. A community tool &amp; equipment lending platform.</p>
          </div>

          <nav className="footer-col" aria-label="Explore">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Browse items</Link></li>
              {user && <li><Link to="/items/new">List an item</Link></li>}
              {user && <li><Link to="/dashboard">Dashboard</Link></li>}
              {user?.role === 'admin' && <li><Link to="/admin">Admin</Link></li>}
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Account">
            <h4>Account</h4>
            <ul>
              {!user && <li><Link to="/login">Log in</Link></li>}
              {!user && <li><Link to="/register">Register</Link></li>}
              {user && <li><Link to={`/profile/${user.id}`}>My profile</Link></li>}
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BorrowBox — Lend it. Borrow it. Track it.</span>
          <span>Built for the U Devs Internship, Batch 6.</span>
        </div>
      </div>
    </footer>
  );
}
