import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ErrorBanner from '../components/ErrorBanner';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      showToast('Welcome back!');
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="auth-shell">
          <aside className="auth-aside">
            <h2>Lend it.<br />Borrow it.<br />Track it.</h2>
            <ul className="auth-points">
              <li><span><strong>Real-time availability</strong>See which dates are free before you ask.</span></li>
              <li><span><strong>Condition logged both ways</strong>Handover and return are recorded for everyone.</span></li>
              <li><span><strong>Reviews build trust</strong>Rate each loan and see a lender's track record.</span></li>
            </ul>
          </aside>
          <div className="auth-main">
        <h1>Log in</h1>
        <p className="auth-sub">Borrow what you need. Lend what you don't.</p>
        <div>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          </form>
          <p className="field-hint auth-hint">Try the demo: ali@borrowbox.app / Passw0rd!</p>
        </div>
        <p className="auth-switch">No account yet? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
