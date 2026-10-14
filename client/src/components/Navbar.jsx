import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const initials = user ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '';

  // Close the mobile menu whenever the route changes or Escape is pressed
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">B</span>
          BorrowBox
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-bars" />
        </button>

        <nav id="primary-nav" className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end>Browse</NavLink>
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && <NavLink to="/items/new">List an item</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}

          {!user && (
            <span className="nav-actions">
              <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </span>
          )}

          {user && (
            <span className="nav-actions">
              <Link to={`/profile/${user.id}`} title={user.name} className="avatar">{initials}</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>
                Log out
              </button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
