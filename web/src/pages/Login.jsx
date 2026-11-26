import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      const user = await login(phone, password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 420, margin: '24px auto' }} onSubmit={submit}>
      <h1>{t('login')}</h1>
      <label>{t('phone')}<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" inputMode="tel" /></label>
      <label>{t('password')}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">{t('login')}</button>
      <p className="muted" style={{ marginTop: 12 }}><Link to="/register">{t('signup')}</Link></p>
    </form>
  );
}
