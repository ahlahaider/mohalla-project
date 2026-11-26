// Screen 6 · The job page. The job agreement is shown as a timeline that grows
// as the job moves on. This IS the trust system, so it must be very clear:
//   - every price the worker sends shows up here,
//   - nothing counts until the customer taps "OK, agree",
//   - entries are never edited: a "No" stays on the record and the worker sends a new price.
// The page checks for news every 15 seconds, so a new price appears without reloading.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PaperPlaneTilt, HandWaving, Handshake, CheckCircle, Phone, WhatsappLogo, ShieldCheck, Footprints,
  PlusCircle, Receipt, XCircle, Hourglass, Prohibit, Check, X, Warning, CaretDown, ArrowRight, Star,
  ChatCircleText, MagnifyingGlass,
} from '@phosphor-icons/react';
import { api, errorText, rupees, timeOf } from '../api.js';
import { useLang } from '../i18n.jsx';
import { firstName } from '../prefs.js';
import { CATEGORY } from '../ui/icons.js';
import { TopBar, Ico, Say, Avatar, Loading, ErrorBox, Sheet } from '../ui/kit.jsx';

const ACTIVE = ['requested', 'accepted', 'agreed'];
const POLL_MS = 15000;

// "Today, morning" from the preferred time saved with the request.
export function whenText(date, t) {
  if (!date) return '';
  const d = new Date(date);
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  const day = days === 0 ? t('today') : days === 1 ? t('tomorrow') : d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
  const h = d.getHours();
  const part = h < 12 ? t('morning') : h < 16 ? t('afternoon') : t('evening');
  return `${day}, ${part.toLowerCase()}`;
}

// What the yellow tag on top says, and which of the 4 steps we're on.
export function jobStatus(job) {
  const waiting = job.agreement?.some((e) => e.status === 'proposed') || job.needsMe;
  switch (job.status) {
    case 'requested': return { k: 's_requested', tone: '', step: 1 };
    case 'accepted': return waiting ? { k: 's_agree', tone: '', step: 2 } : { k: 's_priceWait', tone: 'soft', step: 2 };
    case 'agreed': return waiting ? { k: 's_agree', tone: '', step: 3 } : { k: 's_working', tone: 'leaf', step: 3 };
    case 'completed': return { k: 's_completed', tone: 'leaf', step: 4 };
    case 'declined': return { k: 's_declined', tone: 'chilli', step: -1 };
    case 'expired': return { k: 's_expired', tone: 'chilli', step: -1 };
    case 'cancelled': return { k: 's_cancelled', tone: 'ink', step: -1 };
    default: return { k: 's_open', tone: 'soft', step: 0 };
  }
}

const ENTRY_LOOK = {
  visit: { icon: Footprints, k: 'e_visit' },
  quote: { icon: Handshake, k: 'e_quote' },
  amendment: { icon: PlusCircle, k: 'e_amendment' },
  part: { icon: Receipt, k: 'e_part' },
};

export default function JobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const L = useLang();
  const { t, cat } = L;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(null); // the entry waiting for "Yes, I agree"
  const [cancelling, setCancelling] = useState(false);
  const [bill, setBill] = useState(null);
  const [waitingOffscreen, setWaitingOffscreen] = useState(false);
  const firstWaitingRef = useRef(null);

  const load = useCallback(() => api(`/jobs/${id}`).then((d) => { setJob(d.job); setError(null); }).catch(setError), [id]);

  useEffect(() => { load(); }, [load]);

  // Check for news every 15 seconds while the job is still moving (and the tab is open).
  useEffect(() => {
    if (job && !ACTIVE.includes(job.status) && job.status !== 'completed') return undefined;
    const tick = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(tick);
  }, [job, load]);

  // Show a "price waiting" bar at the bottom while the waiting card is off screen.
  const waitingId = job?.agreement?.find((e) => e.status === 'proposed')?._id;
  useEffect(() => {
    const el = firstWaitingRef.current;
    if (!el || !('IntersectionObserver' in window)) { setWaitingOffscreen(false); return undefined; }
    const io = new IntersectionObserver(([e]) => setWaitingOffscreen(!e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [waitingId]);

  const act = async (path) => {
    setBusy(true);
    try {
      await api(`/jobs/${id}${path}`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!job) return <><TopBar title="" back="/jobs" />{error ? <main className="page"><ErrorBox>{errorText(error, L)}</ErrorBox></main> : <Loading />}</>;

  const worker = job.worker;
  const name = worker ? firstName(worker.name) : '';
  const st = jobStatus(job);
  const service = CATEGORY[job.category];
  const title = job.description.split('. ')[0] || cat(job.category);
  const waitingTotal = job.agreement.filter((e) => e.status === 'proposed').reduce((s, e) => s + e.amount, 0);
  const hasWaiting = waitingTotal > 0 || job.agreement.some((e) => e.status === 'proposed');
  const contactOpen = ['accepted', 'agreed', 'completed'].includes(job.status) && worker?.phone;
  const showPrices = ['accepted', 'agreed', 'completed'].includes(job.status) || job.agreement.length > 0;
  const quoteAcceptedId = job.agreement.find((e) => e.kind === 'quote' && e.status === 'accepted')?._id;

  return (
    <>
      <TopBar
        back="/jobs"
        title={title}
        sub={(
          <>
            <span>{cat(job.category)} · {whenText(job.preferredTime, t)}</span>
            <span style={{ display: 'block', marginTop: 4 }}><span className={`tag ${st.tone}`}>{t(st.k, { name })}</span></span>
          </>
        )}
        right={service && <Ico icon={service.icon} tone={job.category} size={26} box={46} />}
      />

      <main className="page">
        {st.step > 0 && <Steps current={st.step} />}

        {contactOpen && (
          <section className="yes-card pop-in">
            <div className="who">
              <Avatar name={worker.name} />
              <div>
                <h2><Say k="saidYes" vars={{ name }} /></h2>
                <div style={{ opacity: 0.85, fontWeight: 600 }}>{t('canSeeAddress', { name })}</div>
              </div>
            </div>
            <div className="btn-row">
              <a className="btn btn--saffron moves" href={`tel:${worker.phone}`}>
                <span className="ico ico--bare mo-ring"><Phone size={28} weight="fill" /></span><Say k="call" />
              </a>
              <a className="btn btn--wa moves" href={`https://wa.me/92${worker.phone.slice(1)}`} target="_blank" rel="noreferrer">
                <WhatsappLogo size={28} weight="fill" /><Say k="whatsapp" />
              </a>
            </div>
          </section>
        )}

        {showPrices && (
          <>
            <div className="box leaf note">
              <Ico icon={ShieldCheck} tone="leaf" size={24} />
              <Say k="banner" />
            </div>
            <div className="totals">
              <div className="total-box">
                <div className="label">{t('agreedSoFar')}</div>
                <div className="amount">{rupees(job.total)}</div>
              </div>
              {hasWaiting && (
                <div className="total-box waiting">
                  <div className="label">{t('waitingOk')}</div>
                  <div className="amount">+ {rupees(waitingTotal)}</div>
                </div>
              )}
            </div>
          </>
        )}

        <ol className="timeline">
          <TimelineRow icon={PaperPlaneTilt} tone="leaf" text={t('tlSent')} time={job.createdAt} />

          {(job.acceptedAt || ['accepted', 'agreed', 'completed'].includes(job.status)) && (
            <TimelineRow icon={HandWaving} tone="leaf" text={t('tlYes', { name })} time={job.acceptedAt} />
          )}
          {job.status === 'declined' && <TimelineRow icon={XCircle} tone="chilli" text={t('s_declined', { name })} />}
          {job.status === 'expired' && <TimelineRow icon={Hourglass} tone="chilli" text={t('s_expired')} />}

          {job.agreement.map((e) => (
            <li key={e._id} className="tl-item rise-in" ref={e._id === waitingId ? firstWaitingRef : undefined}>
              <Ico icon={ENTRY_LOOK[e.kind].icon} tone={e.status === 'proposed' ? 'saffron' : e.status === 'rejected' ? 'chilli' : 'leaf'} size={24} />
              <Entry entry={e} name={name} isWorkStart={e._id === quoteAcceptedId}
                onAgree={() => setConfirming(e)}
                onNo={() => act(`/agreement/${e._id}/reject`)}
                onBill={() => setBill(e.billPhotoUrl)}
                busy={busy} />
            </li>
          ))}

          {job.status === 'cancelled' && <TimelineRow icon={Prohibit} tone="ink" text={t('s_cancelled')} />}
          {job.status === 'completed' && <TimelineRow icon={CheckCircle} tone="leaf" text={t('stepDone')} time={job.completedAt} />}
        </ol>

        <ErrorBox>{error && errorText(error, L)}</ErrorBox>

        {nextStep({ job, name, service, hasWaiting })}

        {job.dispute && (
          <div className="box saffron note">
            <Ico icon={Warning} tone="saffron" size={22} />
            <span>{t(job.dispute.status === 'open' ? 'reportOpen' : 'reportClosed')}</span>
          </div>
        )}

        <hr className="soft" />
        <div className="stack">
          {['accepted', 'agreed', 'completed'].includes(job.status) && !job.dispute && (
            <Link to={`/jobs/${id}/problem`} className="btn btn--ghost btn--small">
              <Ico icon={Warning} tone="saffron" size={22} box={34} />
              <Say k="somethingWrong" />
            </Link>
          )}
          {ACTIVE.includes(job.status) && (
            <button type="button" className="btn btn--ghost-chilli btn--small" onClick={() => setCancelling(true)}>
              <Ico icon={Prohibit} tone="chilli" size={22} box={34} />
              <Say k="cancelJob" />
            </button>
          )}
        </div>
      </main>

      {/* bottom bar: only while a price is waiting and its card is scrolled out of view */}
      {hasWaiting && waitingOffscreen && (
        <div className="sticky-bar row spread" style={{ background: 'var(--saffron-tint)', borderTopColor: 'var(--saffron)' }}>
          <span style={{ fontWeight: 800 }}>{t('priceWaiting')}</span>
          <button type="button" className="btn btn--saffron btn--small" style={{ width: 'auto' }}
            onClick={() => firstWaitingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            {t('seeIt')} <CaretDown size={20} weight="bold" />
          </button>
        </div>
      )}

      {/* "are you sure?" before agreeing to money */}
      <Sheet open={Boolean(confirming)} onClose={() => setConfirming(null)} label={t('confirmAgreeQ', { amount: '' })}>
        {confirming && (
          <>
            <Ico icon={ENTRY_LOOK[confirming.kind].icon} tone="saffron" size={34} box={64} />
            <h2><Say k="confirmAgreeQ" vars={{ amount: rupees(confirming.amount) }} /></h2>
            <p style={{ fontWeight: 700 }}>{t(ENTRY_LOOK[confirming.kind].k)}{confirming.scope ? ` · ${confirming.scope}` : ''}</p>
            <p className="muted" style={{ fontWeight: 600 }}>{t('confirmAgreeNote')}</p>
            <button type="button" className="btn" disabled={busy}
              onClick={async () => { const e = confirming; setConfirming(null); await act(`/agreement/${e._id}/accept`); }}>
              <Check size={26} weight="bold" /><Say k="yesAgree" />
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirming(null)}>{t('goBack')}</button>
          </>
        )}
      </Sheet>

      <Sheet open={cancelling} onClose={() => setCancelling(false)} label={t('cancelQ')}>
        <Ico icon={Prohibit} tone="chilli" size={34} box={64} />
        <h2><Say k="cancelQ" /></h2>
        <p style={{ fontWeight: 600 }}>{t('cancelNote', { name: name || '—' })}</p>
        <button type="button" className="btn btn--chilli" disabled={busy}
          onClick={async () => { setCancelling(false); await act('/cancel'); }}>
          <X size={24} weight="bold" /><Say k="yesCancel" />
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setCancelling(false)}>{t('keepJob')}</button>
      </Sheet>

      <Sheet open={Boolean(bill)} onClose={() => setBill(null)} label={t('billTitle')}>
        <h2><Say k="billTitle" /></h2>
        {bill && <img className="photo-full" src={bill} alt={t('billTitle')} />}
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setBill(null)}>{t('close')}</button>
      </Sheet>
    </>
  );

  // What happens next, at the end of the timeline. (A plain function, not a component,
  // so it doesn't re-mount every time the page refreshes.)
  function nextStep({ job: j, name: n, service: svc, hasWaiting: waiting }) {
    if (j.status === 'requested') {
      return <Line icon={Hourglass} waiting text={t('next_requested', { name: n, time: j.expiresAt ? timeOf(j.expiresAt) : '' })} />;
    }
    if (waiting) return <Line icon={ArrowRight} text={t('next_answer')} />;
    if (j.status === 'accepted') {
      const visitAgreed = j.agreement.some((e) => e.kind === 'visit' && e.status === 'accepted');
      return <Line icon={Hourglass} waiting text={t(visitAgreed ? 'next_quote' : 'next_visit', { name: n })} />;
    }
    if (j.status === 'agreed') {
      return (
        <button type="button" className="btn btn--saffron moves" onClick={() => navigate(`/jobs/${j.id}/finish`)}>
          <Ico icon={CheckCircle} tone="saffron" size={28} box={40} motion="wiggle" />
          <Say k="workFinished" />
        </button>
      );
    }
    if (j.status === 'completed') {
      const todo = !j.reviewedByMe || j.payment?.customerAmount == null;
      const p = j.payment || {};
      const mismatch = p.customerAmount != null && p.workerAmount != null && !p.matched;
      return (
        <div className="stack">
          {todo
            ? (
              <button type="button" className="btn btn--saffron" onClick={() => navigate(`/jobs/${j.id}/finish`)}>
                <Star size={26} weight="fill" /><Say k="next_rate" />
              </button>
            )
            : <Line icon={CheckCircle} text={t('next_done')} />}
          {p.customerAmount != null && !mismatch && <Line icon={ChatCircleText} text={t('youPaid', { amount: rupees(p.customerAmount) })} />}
          {mismatch && (
            <div className="box chilli note">
              <Ico icon={Warning} tone="chilli" size={22} />
              <span>{t('payMismatch', { a: rupees(p.customerAmount), b: rupees(p.workerAmount), name: n })}</span>
            </div>
          )}
          {j.worker && (
            <Link className="btn btn--ghost btn--small" to={`/workers/${j.worker.id}/request?cat=${j.category}`}>
              <HandWaving size={24} weight="duotone" />{t('askAgain', { name: n })}
            </Link>
          )}
        </div>
      );
    }
    if (j.status === 'declined' || j.status === 'expired') {
      return (
        <div className="stack">
          <Line icon={XCircle} text={t(j.status === 'declined' ? 'next_declined' : 'next_expired', { name: n })} />
          <Link className="btn btn--henna" to={`/find/${j.category}`}>
            {svc ? <Ico icon={svc.icon} tone="cream" size={24} box={36} /> : <MagnifyingGlass size={24} />}
            <Say k="askSomeoneElse" />
          </Link>
        </div>
      );
    }
    if (j.status === 'cancelled') return <Line icon={Prohibit} text={t('next_cancelled')} />;
    return null;
  }
}

function Steps({ current }) {
  const steps = [
    ['stepSent', PaperPlaneTilt],
    ['stepYes', HandWaving],
    ['stepPrice', Handshake],
    ['stepDone', CheckCircle],
  ];
  const { t } = useLang();
  return (
    <div className="steps" aria-label="progress">
      {steps.map(([k, icon], i) => (
        <div key={k} className={`step ${i < current ? 'done' : i === current ? 'now' : ''}`}>
          <Ico icon={icon} size={24} box={46} weight={i < current ? 'fill' : 'duotone'} />
          <span>{t(k)}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({ icon, tone, text, time }) {
  return (
    <li className="tl-item">
      <Ico icon={icon} tone={tone} size={24} />
      <div className="tl-body">
        {text}
        {time && <span className="tl-time"> · {timeOf(time)}</span>}
      </div>
    </li>
  );
}

function Entry({ entry: e, name, isWorkStart, onAgree, onNo, onBill, busy }) {
  const { t, u } = useLang();
  const look = ENTRY_LOOK[e.kind];
  return (
    <div className={`entry ${e.status}`}>
      <div className="entry-head">
        <span className="say">
          <span className="entry-name">{t(look.k)}</span>
          <span className="ur" dir="rtl">{u(look.k)}</span>
        </span>
        <span className="entry-amount">{rupees(e.amount)}</span>
      </div>
      {e.kind === 'visit' && !e.scope && <div className="scope">{t('e_visit_sub')}</div>}
      {e.scope && <div className="scope">{e.scope}</div>}
      {e.billPhotoUrl && (
        <button type="button" className="bill-thumb" onClick={onBill}>
          <img src={e.billPhotoUrl} alt="" loading="lazy" onError={(ev) => { ev.currentTarget.style.visibility = 'hidden'; }} />
          <span>{t('seeBill')}</span>
        </button>
      )}

      {e.status === 'proposed' && (
        <div className="btn-row">
          <button type="button" className="btn btn--small" style={{ flex: 2 }} disabled={busy} onClick={onAgree}>
            <Check size={24} weight="bold" /><Say k="okAgree" />
          </button>
          <button type="button" className="btn btn--chilli btn--small" disabled={busy} onClick={onNo}>
            <X size={24} weight="bold" /><Say k="sayNo" />
          </button>
        </div>
      )}
      {e.status === 'accepted' && (
        <div className="verdict ok"><CheckCircle size={22} weight="fill" />{t(isWorkStart ? 'youAgreedStart' : 'youAgreed')}</div>
      )}
      {e.status === 'rejected' && (
        <div className="verdict no"><XCircle size={22} weight="fill" />{t('youSaidNo', { name })}</div>
      )}
    </div>
  );
}

function Line({ icon, text, waiting = false }) {
  return (
    <div className="next-line">
      <Ico icon={icon} tone="saffron" size={24} className={waiting ? 'waiting' : ''} />
      <span>{text}</span>
    </div>
  );
}
