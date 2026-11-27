// A posted job, before anyone is picked: the prices workers sent, each with the
// worker's photo, rating and jobs done. "Pick {name}" agrees that price and turns it
// into a normal job (the job page then shows the timeline, call/WhatsApp, etc.).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Hourglass, Star, CheckCircle, ShieldCheck, Storefront, Sparkle, Handshake, Prohibit, X, ArrowCounterClockwise, CaretRight,
} from '@phosphor-icons/react';
import { api, errorText, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import { firstName } from '../prefs.js';
import { CATEGORY } from '../ui/icons.js';
import { TopBar, Ico, Say, Avatar, ErrorBox, Sheet } from '../ui/kit.jsx';

export default function Offers({ job, reload, whenLine, status }) {
  const L = useLang();
  const { t, cat } = L;
  const navigate = useNavigate();
  const [picking, setPicking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const service = CATEGORY[job.category];
  const open = job.status === 'open';
  const quotes = [...(job.quotes || [])].sort((a, b) => a.amount - b.amount);

  async function act(path) {
    setBusy(true);
    setError(null);
    try { await api(`/jobs/${job.id}${path}`, { method: 'POST' }); await reload(); } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <>
      <TopBar
        back="/jobs"
        title={job.description.split('. ')[0] || cat(job.category)}
        sub={(
          <>
            <span>{cat(job.category)} · {whenLine}</span>
            <span style={{ display: 'block', marginTop: 4 }}><span className={`tag ${status.tone}`}>{t(status.k)}</span></span>
          </>
        )}
        right={service && <Ico icon={service.icon} tone={job.category} size={26} box={46} />}
      />
      <main className="page">
        {open && job.expiresAt && (
          <div className="box saffron note">
            <Ico icon={Hourglass} tone="saffron" size={22} className="waiting" />
            <span>{t('closesAt', { time: new Date(job.expiresAt).toLocaleString('en-PK', { weekday: 'long', hour: 'numeric', minute: '2-digit' }) })}</span>
          </div>
        )}
        {job.status === 'expired' && (
          <div className="stack">
            <div className="box chilli note"><Ico icon={X} tone="chilli" size={22} /><span>{t('postExpired')}</span></div>
            <Link className="btn btn--henna" to={`/find/${job.category}/post`}><ArrowCounterClockwise size={24} weight="bold" /><Say k="postAgain" /></Link>
          </div>
        )}
        {job.status === 'cancelled' && <div className="box note"><Ico icon={Prohibit} tone="ink" size={22} /><span>{t('next_cancelled')}</span></div>}

        <h2 className="q"><Say k="offersTitle" /></h2>
        {quotes.length === 0 && (
          <div className="empty card">
            <Ico icon={Hourglass} tone="saffron" size={40} className="waiting" />
            <b>{t('offersNone')}</b>
            <p className="muted">{t('offersNoneHint')}</p>
          </div>
        )}

        {quotes.map((q, i) => {
          const w = q.worker || {};
          const name = firstName(w.name || '');
          return (
            <section key={q.id} className="card stack rise-in" style={{ '--i': i }}>
              <Link to={`/workers/${w.id}`} className="row" style={{ gap: 12 }}>
                <Avatar name={w.name || '?'} photoUrl={w.photoUrl} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 18 }}>{w.name}</b>
                  <div className="badges">
                    {w.badges?.verified && <span className="badge leaf"><ShieldCheck size={16} weight="fill" />{t('bVerified')}</span>}
                    {w.badges?.founding && <span className="badge saffron"><Storefront size={16} weight="fill" />{t('bFounding')}</span>}
                    {w.reliability?.isNew && <span className="badge saffron"><Sparkle size={16} weight="fill" />{t('bNew')}</span>}
                  </div>
                  <div className="muted" style={{ fontWeight: 700 }}>
                    {w.rating ? <><Star size={16} weight="fill" color="var(--saffron)" /> {w.rating.avg} · </> : null}
                    {t('jobsDoneN', { n: w.reliability?.completed ?? 0 })}
                  </div>
                </div>
                <CaretRight size={20} weight="bold" />
              </Link>
              <div className="row spread">
                <span className="muted" style={{ fontWeight: 700 }}>{t('fullPrice')}</span>
                <b style={{ fontSize: 28 }}>{rupees(q.amount)}</b>
              </div>
              {q.note && <p className="box">“{q.note}”</p>}
              {open && (
                <button type="button" className="btn moves" onClick={() => setPicking(q)}>
                  <Ico icon={Handshake} tone="cream" size={24} box={36} motion="wiggle" />
                  <Say k="pickWorker" vars={{ name }} />
                </button>
              )}
            </section>
          );
        })}

        <ErrorBox>{error && errorText(error, L)}</ErrorBox>

        {open && (
          <button type="button" className="btn btn--ghost-chilli btn--small" onClick={() => setCancelling(true)}>
            <Ico icon={Prohibit} tone="chilli" size={22} box={34} />
            <Say k="cancelPost" />
          </button>
        )}
      </main>

      <Sheet open={Boolean(picking)} onClose={() => setPicking(null)} label={t('pickWorker', { name: '' })}>
        {picking && (() => {
          const name = firstName(picking.worker?.name || '');
          return (
            <>
              <Ico icon={Handshake} tone="leaf" size={34} box={64} />
              <h2><Say k="pickQ" vars={{ name, amount: rupees(picking.amount) }} /></h2>
              <p style={{ fontWeight: 600 }}>{t('pickNote', { name })}</p>
              <button type="button" className="btn" disabled={busy}
                onClick={async () => { const q = picking; setPicking(null); await act(`/quotes/${q.id}/pick`); }}>
                <CheckCircle size={26} weight="fill" /><Say k="yesPick" vars={{ name }} />
              </button>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setPicking(null)}>{t('goBack')}</button>
            </>
          );
        })()}
      </Sheet>

      <Sheet open={cancelling} onClose={() => setCancelling(false)} label={t('cancelPost')}>
        <Ico icon={Prohibit} tone="chilli" size={34} box={64} />
        <h2><Say k="cancelPost" /></h2>
        <button type="button" className="btn btn--chilli" disabled={busy}
          onClick={async () => { setCancelling(false); await act('/cancel'); navigate('/jobs'); }}>
          <X size={24} weight="bold" /><Say k="yesCancel" />
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setCancelling(false)}>{t('keepJob')}</button>
      </Sheet>
    </>
  );
}
