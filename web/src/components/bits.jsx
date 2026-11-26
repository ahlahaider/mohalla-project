// Small pieces reused across pages.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';

// Loads /api/meta (categories + areas) once per page that needs it.
export function useMeta() {
  const [meta, setMeta] = useState({ categories: [], areas: [] });
  useEffect(() => { api('/meta').then(setMeta).catch(() => {}); }, []);
  return meta;
}

export const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function Badges({ badges = {} }) {
  const { t } = useLang();
  return (
    <span className="row" style={{ gap: 6 }}>
      {badges.founding && <span className="chip gold">★ {t('founding')}</span>}
      {badges.verified && <span className="chip green">✓ {t('verified')}</span>}
    </span>
  );
}

// Plain counts instead of one made-up score (see the spec's trust system).
export function Reliability({ reliability, rating }) {
  const { t } = useLang();
  if (!reliability) return null;
  return (
    <span className="muted">
      {rating && <>★ {rating.avg} ({rating.count}) · </>}
      {reliability.isNew
        ? <span className="chip">{t('newWorker')}</span>
        : <>{reliability.completed}/{reliability.accepted} {t('jobsDone')}{reliability.onTimePct != null && <> · {reliability.onTimePct}% {t('onTime')}</>}</>}
    </span>
  );
}

export function WorkerCard({ worker }) {
  const { t, cat, icon, areaName } = useLang();
  const p = worker.workerProfile || {};
  return (
    <Link to={`/workers/${worker.id}`} className="card row" style={{ textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}>
      <div className="avatar">{initials(worker.name)}</div>
      <div style={{ flex: 1 }}>
        <div className="row spread">
          <h3 style={{ margin: 0 }}>{worker.name}</h3>
          <span className="muted">{rupees(p.priceMin)} – {rupees(p.priceMax)}</span>
        </div>
        <div className="row" style={{ gap: 6, margin: '4px 0' }}>
          {p.skills?.map((s) => <span key={s} className="chip">{icon(s)} {cat(s)}</span>)}
          <Badges badges={worker.badges} />
          {p.availableToday && <span className="chip green">● {t('availableToday')}</span>}
        </div>
        <div className="muted">{p.areasServed?.map(areaName).join(', ')}</div>
        <Reliability reliability={worker.reliability} rating={worker.rating} />
      </div>
    </Link>
  );
}

export function StatusChip({ status }) {
  const { status: label } = useLang();
  const colour = { completed: 'green', agreed: 'green', accepted: 'green', declined: 'red', expired: 'red', cancelled: 'red', rejected: 'red', upheld: 'red' }[status] || 'gold';
  return <span className={`chip ${colour}`}>{label(status)}</span>;
}

export function Stars({ value, onChange }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)} aria-label={`${n} stars`}>★</button>
      ))}
    </span>
  );
}

// Shared form for a direct request (with workerId) or a posted job (without).
export function JobForm({ categories, defaultArea, workerId, submitLabel, onDone }) {
  const { t, cat, areaName } = useLang();
  const { areas } = useMeta();
  const [form, setForm] = useState({ category: categories[0] || '', description: '', address: '', area: defaultArea || '', preferredTime: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { if (!form.category && categories[0]) setForm((f) => ({ ...f, category: categories[0] })); }, [categories]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const { job } = await api('/jobs', {
        method: 'POST',
        body: { ...form, mode: workerId ? 'direct' : 'quotes', workerId, preferredTime: form.preferredTime || undefined },
      });
      onDone(job);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <label>{t('service')}
        <select value={form.category} onChange={set('category')}>
          {categories.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
        </select>
      </label>
      <label>{t('describe')}<textarea rows={3} value={form.description} onChange={set('description')} required /></label>
      <div className="grid2">
        <label>{t('area')}
          <select value={form.area} onChange={set('area')} required>
            <option value="">—</option>
            {areas.map((a) => <option key={a} value={a}>{areaName(a)}</option>)}
          </select>
        </label>
        <label>{t('preferredTime')}<input type="datetime-local" value={form.preferredTime} onChange={set('preferredTime')} /></label>
      </div>
      <label>{t('address')}<input value={form.address} onChange={set('address')} required />
        <span className="muted">{t('addressNote')}</span>
      </label>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">{submitLabel}</button>
    </form>
  );
}
