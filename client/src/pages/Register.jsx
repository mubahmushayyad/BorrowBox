import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ErrorBanner from '../components/ErrorBanner';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', area: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      await register(form);
      showToast('Account created — welcome to BorrowBox!');
      navigate('/');
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
            <h2>One account to lend and borrow.</h2>
            <ul className="auth-points">
              <li><span><strong>List what you own</strong>Share tools and gadgets that sit idle.</span></li>
              <li><span><strong>Approve every request</strong>You decide who borrows and for how long.</span></li>
              <li><span><strong>Know your neighbours</strong>Pickup areas and ratings keep it local and trusted.</span></li>
            </ul>
          </aside>
          <div className="auth-main">
        <h1>Create your account</h1>
        <p className="auth-sub">It takes less than a minute.</p>
        <div>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" required value={form.name} onChange={update('name')} placeholder="Ali Khan" />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" value={form.phone} onChange={update('phone')} placeholder="0300-0000000" />
              </div>
              <div className="field">
                <label htmlFor="area">Area</label>
                <input id="area" value={form.area} onChange={update('area')} placeholder="Block B" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
          </form>
        </div>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
