// Customer sign-up. Workers sign up in the worker app instead.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { useMeta } from '../components/bits.jsx';

export default function Register() {
  const { register } = useAuth();
  const { t, lang, areaName } = useLang();
  const { areas } = useMeta();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', area: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      await register({ ...form, role: 'customer', language: lang });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 420, margin: '24px auto' }} onSubmit={submit}>
      <h1>{t('signup')}</h1>
      <label>{t('name')}<input value={form.name} onChange={set('name')} required /></label>
      <label>{t('phone')}<input value={form.phone} onChange={set('phone')} placeholder="0300 1234567" inputMode="tel" required /></label>
      <label>{t('password')}<input type="password" value={form.password} onChange={set('password')} minLength={6} required /></label>
      <label>{t('area')}
        <select value={form.area} onChange={set('area')} required>
          <option value="">—</option>
          {areas.map((a) => <option key={a} value={a}>{areaName(a)}</option>)}
        </select>
      </label>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">{t('signup')}</button>
      <p className="muted" style={{ marginTop: 12 }}>{t('workersUseApp')}</p>
    </form>
  );
}
