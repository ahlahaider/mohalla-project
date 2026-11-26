// The admin side keeps its original desktop layout and password login.
// (Customers use the phone-first app with number + PIN instead.)
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { errorText } from '../api.js';
import { useLang } from '../i18n.jsx';
import Admin from './Admin.jsx';
import './admin.css';

export function AdminPage() {
  const { user, loading, logout } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return (
    <div className="admin">
      <header className="topbar">
        <Link to="/" className="logo">mohalla</Link>
        <nav><span>Admin</span></nav>
        <button onClick={logout}>Log out</button>
      </header>
      <main className="shell"><Admin /></main>
    </div>
  );
}

export function AdminLogin() {
  const { loginWithPassword } = useAuth();
  const L = useLang();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await loginWithPassword(phone, password);
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(errorText(err, L));
    }
  }

  return (
    <div className="admin">
      <main className="shell">
        <form className="card" style={{ maxWidth: 420, margin: '24px auto' }} onSubmit={submit}>
          <h1>Admin log in</h1>
          <label>Mobile number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 0000000" inputMode="tel" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">Log in</button>
        </form>
      </main>
    </div>
  );
}
