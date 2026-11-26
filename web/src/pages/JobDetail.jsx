// One job, from the customer's side: contact details once accepted, the
// job agreement (accept/reject each proposal), completion, payment, rating,
// and the dispute form. What shows depends on the job's status.
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import { StatusChip, Stars, Badges } from '../components/bits.jsx';

const ACTIVE = ['open', 'requested', 'accepted', 'agreed'];

// Turns "03001234567" into a WhatsApp link (Pakistan code 92, no leading 0).
const whatsapp = (phone) => `https://wa.me/92${phone.slice(1)}`;

export default function JobDetail() {
  const { id } = useParams();
  const L = useLang();
  const { t } = L;
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => api(`/jobs/${id}`).then((d) => setJob(d.job)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  // Runs an action, shows any error, then reloads the job so the page matches the server.
  const act = async (path, body, message) => {
    setError('');
    setNotice('');
    try {
      const res = await api(`/jobs/${id}${path}`, { method: 'POST', body });
      if (message) setNotice(typeof message === 'function' ? message(res) : message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!job) return error ? <p className="error">{error}</p> : null;
  const other = job.myRole === 'customer' ? job.worker : job.customer;

  return (
    <>
      <div className="card">
        <div className="row spread">
          <h1>{L.icon(job.category)} {L.cat(job.category)}</h1>
          <StatusChip status={job.status} />
        </div>
        <p>{job.description}</p>
        <p className="muted">
          {L.areaName(job.area)}{job.address && ` · ${job.address}`}
          {job.preferredTime && ` · ${new Date(job.preferredTime).toLocaleString()}`}
        </p>
        {job.status === 'requested' && job.expiresAt && (
          <p className="muted">{t('expiresAt')} {new Date(job.expiresAt).toLocaleTimeString()}</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {notice && <p className="ok">{notice}</p>}

      {other && (
        <div className="card row spread">
          <div>
            <h3 style={{ margin: 0 }}>{other.name}</h3>
            <Badges badges={other.badges} />
            {other.rating && <span className="muted"> ★ {other.rating.avg} ({other.rating.count})</span>}
          </div>
          {other.phone && (
            <div className="row">
              <a className="btn" href={`tel:${other.phone}`}>📞 {t('call')}</a>
              <a className="btn" href={whatsapp(other.phone)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
            </div>
          )}
        </div>
      )}

      {job.status === 'open' && <Quotes job={job} act={act} />}
      {job.status !== 'open' && <Agreement job={job} act={act} />}
      {job.status === 'agreed' && job.myRole === 'customer' && <Complete act={act} />}
      {job.status === 'completed' && <Payment job={job} act={act} />}
      {job.status === 'completed' && <Review job={job} act={act} />}
      {['accepted', 'agreed', 'completed'].includes(job.status) && <Dispute job={job} act={act} />}

      <div className="row" style={{ marginTop: 12 }}>
        {ACTIVE.includes(job.status) && <button onClick={() => window.confirm('Cancel this job?') && act('/cancel')}>{t('cancelJob')}</button>}
        {other && <ReportButton userId={other.id} />}
      </div>
    </>
  );
}

function Quotes({ job, act }) {
  const { t } = useLang();
  return (
    <div className="card">
      <h2>{t('quotes')}</h2>
      {job.quotes?.length === 0 && <p className="muted">{t('noQuotes')}</p>}
      {job.quotes?.map((q) => (
        <div key={q.id} className="entry">
          <div><strong>{q.worker?.name}</strong> <Badges badges={q.worker?.badges} />{q.note && <p className="muted">{q.note}</p>}</div>
          <div className="row"><strong>{rupees(q.amount)}</strong><button className="primary" onClick={() => act(`/quotes/${q.id}/pick`)}>{t('pick')}</button></div>
        </div>
      ))}
    </div>
  );
}

function Agreement({ job, act }) {
  const L = useLang();
  const { t } = L;
  const canDecide = job.myRole === 'customer';
  return (
    <div className="card">
      <h2>{t('agreement')}</h2>
      <p className="muted">{t('agreementNote')}</p>
      {job.agreement.length === 0 && <p className="muted">{t('noEntries')}</p>}
      {job.agreement.map((e) => (
        <div key={e._id} className={`entry ${e.status}`}>
          <div>
            <strong>{L.entry(e.kind)}</strong> {e.scope && <span>· {e.scope}</span>}
            {e.billPhotoUrl && <> · <a href={e.billPhotoUrl} target="_blank" rel="noreferrer">bill</a></>}
            <div className="muted">{new Date(e.proposedAt).toLocaleString()}</div>
          </div>
          <div className="row">
            <strong>{rupees(e.amount)}</strong>
            {e.status === 'proposed' && canDecide ? (
              <>
                <button className="go" onClick={() => act(`/agreement/${e._id}/accept`)}>✓ {t('accept')}</button>
                <button className="stop" onClick={() => act(`/agreement/${e._id}/reject`)}>✕ {t('reject')}</button>
              </>
            ) : <StatusChip status={e.status} />}
          </div>
        </div>
      ))}
      <div className="entry"><strong>{t('total')}</strong><strong>{rupees(job.total)}</strong></div>
    </div>
  );
}

function Complete({ act }) {
  const { t } = useLang();
  const [asking, setAsking] = useState(false);
  return (
    <div className="card">
      {!asking
        ? <button className="primary" onClick={() => setAsking(true)}>{t('markComplete')}</button>
        : (
          <div className="row">
            <strong>{t('onTimeQ')}</strong>
            <button className="go" onClick={() => act('/complete', { onTime: true })}>{t('yes')}</button>
            <button className="stop" onClick={() => act('/complete', { onTime: false })}>{t('no')}</button>
          </div>
        )}
    </div>
  );
}

function Payment({ job, act }) {
  const { t } = useLang();
  const mine = job.myRole === 'customer' ? job.payment?.customerAmount : job.payment?.workerAmount;
  const [amount, setAmount] = useState(mine ?? job.total);
  const both = job.payment?.customerAmount != null && job.payment?.workerAmount != null;
  return (
    <div className="card">
      <h2>{t('confirmPayment')}</h2>
      <div className="row">
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ maxWidth: 180 }} />
        <button className="primary" onClick={() => act('/payment', { amount: Number(amount) })}>{t('confirm')}</button>
      </div>
      {both && (job.payment.matched
        ? <p className="ok">{t('paymentMatched')}</p>
        : <p className="error">{t('paymentMismatch')} ({rupees(job.payment.customerAmount)} / {rupees(job.payment.workerAmount)})</p>)}
    </div>
  );
}

function Review({ job, act }) {
  const { t } = useLang();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  if (job.reviewedByMe) return <div className="card"><p className="muted">{t('rated')} {t('ratingHidden')}</p></div>;
  return (
    <div className="card">
      <h2>{t('rate')}</h2>
      <Stars value={stars} onChange={setStars} />
      <label>{t('comment')}<textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
      <p className="muted">{t('ratingHidden')}</p>
      <button className="primary" disabled={!stars} onClick={() => act('/review', { stars, comment })}>{t('submit')}</button>
    </div>
  );
}

function Dispute({ job, act }) {
  const L = useLang();
  const { t } = L;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(job.status === 'completed' ? 'scope' : 'no-show');
  const [text, setText] = useState('');

  if (job.dispute) {
    return <div className="card row"><strong>{t('disputeOpen')}:</strong> {L.dispute(job.dispute.type)} <StatusChip status={job.dispute.status} /></div>;
  }
  if (!open) return <button onClick={() => setOpen(true)}>⚠ {t('openDispute')}</button>;
  return (
    <div className="card">
      <h2>{t('openDispute')}</h2>
      <label>{t('disputeType')}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {L.disputeTypes.map((d) => <option key={d} value={d}>{L.dispute(d)}</option>)}
        </select>
      </label>
      <label>{t('disputeText')}<textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <button className="primary" onClick={() => act('/disputes', { type, text })}>{t('submit')}</button>
    </div>
  );
}

function ReportButton({ userId }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  async function report() {
    const reason = window.prompt('What happened? An admin will review this, and the account is paused meanwhile.');
    if (!reason) return;
    await api('/reports', { method: 'POST', body: { againstId: userId, reason, safety: true } });
    setSent(true);
  }
  return sent ? <span className="muted">Reported.</span> : <button onClick={report}>🚩 {t('reportSafety')}</button>;
}
