// Admin screens: dispute queue (claims next to the job record), user
// management (badges, suspensions) and safety reports.
import { useCallback, useEffect, useState } from 'react';
import { api, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import './admin.css';

export default function Admin() {
  const [tab, setTab] = useState('disputes');
  return (
    <>
      <div className="tabs">
        {['disputes', 'users', 'reports'].map((x) => (
          <button key={x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>{x[0].toUpperCase() + x.slice(1)}</button>
        ))}
      </div>
      {tab === 'disputes' && <Disputes />}
      {tab === 'users' && <Users />}
      {tab === 'reports' && <Reports />}
    </>
  );
}

function Disputes() {
  const L = useLang();
  const [disputes, setDisputes] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api('/disputes?status=open').then((d) => setDisputes(d.disputes)).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function rule(id, outcome, againstId) {
    const note = window.prompt('Note for the record (what in the record decided this)?') ?? '';
    try {
      await api(`/disputes/${id}/ruling`, { method: 'POST', body: { outcome, againstId, note } });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!disputes) return error ? <p className="error">{error}</p> : null;
  return (
    <>
      {error && <p className="error">{error}</p>}
      {disputes.length === 0 && <p className="muted">No open disputes.</p>}
      {disputes.map((d) => (
        <div key={d.id} className="card">
          <div className="row spread">
            <h2>{L.dispute(d.type)}</h2>
            <span className="muted">opened {new Date(d.createdAt).toLocaleString()} · reply by {new Date(d.respondBy).toLocaleString()}</span>
          </div>
          <p>
            <strong>{d.openedBy.name}</strong> ({d.openedBy.role}, {d.openedBy.strikes} strikes) vs{' '}
            <strong>{d.against.name}</strong> ({d.against.role}, {d.against.strikes} strikes)
          </p>

          <div className="grid2" style={{ alignItems: 'start' }}>
            <div>
              <h3>Statements</h3>
              {d.statements.map((s, i) => (
                <div key={i} className="entry" style={{ display: 'block' }}>
                  <strong>{s.by}</strong> <span className="muted">{new Date(s.at).toLocaleString()}</span>
                  <p>{s.text}</p>
                  {s.evidenceUrls?.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer">evidence </a>)}
                </div>
              ))}
            </div>
            <div>
              <h3>The record</h3>
              {d.record?.agreement.map((e) => (
                <div key={e._id} className={`entry ${e.status}`}>
                  <span>{L.entry(e.kind)} {e.scope && `· ${e.scope}`} {e.billPhotoUrl && <a href={e.billPhotoUrl} target="_blank" rel="noreferrer">bill</a>}</span>
                  <span>{rupees(e.amount)} <StatusChip status={e.status} /></span>
                </div>
              ))}
              <div className="entry"><strong>Agreed total</strong><strong>{rupees(d.record?.total)}</strong></div>
              <p className="muted">
                Paid: customer says {rupees(d.record?.payment?.customerAmount)}, worker says {rupees(d.record?.payment?.workerAmount)}
                {d.record?.onTime != null && ` · on time: ${d.record.onTime ? 'yes' : 'no'}`}
              </p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <button className="stop" onClick={() => rule(d.id, 'upheld', d.against.id)}>Record supports {d.openedBy.name}: strike {d.against.name}</button>
            <button className="stop" onClick={() => rule(d.id, 'upheld', d.openedBy.id)}>Record supports {d.against.name}: strike {d.openedBy.name}</button>
            <button onClick={() => rule(d.id, 'unresolved')}>Unresolved (no strike)</button>
            <button onClick={() => rule(d.id, 'settled')}>Settled between them</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Users() {
  const [filters, setFilters] = useState({ phone: '', role: '', flagged: false });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const q = new URLSearchParams();
    if (filters.phone) q.set('phone', filters.phone);
    if (filters.role) q.set('role', filters.role);
    if (filters.flagged) q.set('flagged', 'true');
    api(`/admin/users?${q}`).then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const update = (id, body) => api(`/admin/users/${id}`, { method: 'PATCH', body }).then(load).catch((e) => setError(e.message));

  return (
    <>
      <div className="card grid2">
        <label>Phone<input value={filters.phone} onChange={(e) => setFilters({ ...filters, phone: e.target.value })} /></label>
        <label>Role
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All</option><option value="worker">Workers</option><option value="customer">Customers</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={filters.flagged} onChange={(e) => setFilters({ ...filters, flagged: e.target.checked })} />Flagged only (3 unresolved disputes in 30 days)</label>
      </div>
      {error && <p className="error">{error}</p>}
      {users.map((u) => (
        <div key={u.id} className="card">
          <div className="row spread">
            <div>
              <strong>{u.name}</strong> <span className="muted">{u.role} · {u.phone}</span>{' '}
              <span className={`chip ${u.status === 'active' ? 'green' : 'red'}`}>{u.status}</span>{' '}
              {u.flaggedForReview && <span className="chip red">flagged</span>}
              <div className="muted">{u.strikes.length} strikes</div>
            </div>
            <div className="row">
              <label className="check"><input type="checkbox" checked={u.badges.verified} onChange={(e) => update(u.id, { verified: e.target.checked })} />Verified</label>
              <label className="check"><input type="checkbox" checked={u.badges.founding} onChange={(e) => update(u.id, { founding: e.target.checked })} />Founding</label>
              {u.role === 'worker' && <label className="check"><input type="checkbox" checked={!!u.workerProfile?.featured} onChange={(e) => update(u.id, { featured: e.target.checked })} />Featured</label>}
            </div>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button onClick={() => update(u.id, { action: 'suspend', days: 7 })}>Suspend 7 days</button>
            <button className="stop" onClick={() => window.confirm(`Ban ${u.name}?`) && update(u.id, { action: 'ban' })}>Ban</button>
            <button className="go" onClick={() => update(u.id, { action: 'reinstate', clearFlag: true })}>Reinstate</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);
  const load = useCallback(() => api('/admin/reports').then((d) => setReports(d.reports)), []);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      {reports.length === 0 && <p className="muted">No open reports.</p>}
      {reports.map((r) => (
        <div key={r._id} className="card row spread">
          <div>
            <strong>{r.from?.name}</strong> reported <strong>{r.against?.name}</strong> ({r.against?.status}){r.safety && <span className="chip red"> safety</span>}
            <p>{r.reason}</p>
          </div>
          <button onClick={() => api(`/admin/reports/${r._id}`, { method: 'PATCH' }).then(load)}>Close</button>
        </div>
      ))}
    </>
  );
}

// Coloured label for a status (was in components/bits.jsx before the customer redesign).
function StatusChip({ status }) {
  const { status: label } = useLang();
  const colour = { completed: 'green', agreed: 'green', accepted: 'green', declined: 'red', expired: 'red', cancelled: 'red', rejected: 'red', upheld: 'red' }[status] || 'gold';
  return <span className={`chip ${colour}`}>{label(status)}</span>;
}
