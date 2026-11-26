// Screen 7 · Finish, pay, rate: "3 taps and you are done".
//   1. Did they come on time?          -> POST /jobs/:id/complete
//   2. How much cash did you give?     -> POST /jobs/:id/payment
//   3. Stars (+ optional words)        -> POST /jobs/:id/review
// If some of this was already done (e.g. the page was closed half way),
// those questions are skipped.
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, Clock, Timer, Star, EyeSlash, Confetti, HouseLine, ClipboardText, Money } from '@phosphor-icons/react';
import { api, errorText, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import { firstName } from '../prefs.js';
import { TopBar, Ico, Say, Loading, ErrorBox } from '../ui/kit.jsx';

export default function Finish() {
  const { id } = useParams();
  const L = useLang();
  const { t } = L;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [onTime, setOnTime] = useState(null);
  const [paidSame, setPaidSame] = useState(null); // true = the agreed price, false = different
  const [other, setOther] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { api(`/jobs/${id}`).then((d) => setJob(d.job)).catch(setError); }, [id]);

  if (!job) return <><TopBar title="" />{error ? <main className="page"><ErrorBox>{errorText(error, L)}</ErrorBox></main> : <Loading />}</>;

  const name = firstName(job.worker?.name || '');
  const ask1 = job.status === 'agreed';
  const ask2 = job.payment?.customerAmount == null;
  const ask3 = !job.reviewedByMe;

  // Nothing left to ask (or the job isn't at this stage): back to the job page.
  if (!done && (!['agreed', 'completed'].includes(job.status) || (!ask1 && !ask2 && !ask3))) {
    return <Navigate to={`/jobs/${id}`} replace />;
  }

  const amount = paidSame ? job.total : Number(other);
  const ok1 = !ask1 || onTime != null;
  const ok2 = !ask2 || paidSame === true || (paidSame === false && other !== '' && amount >= 0);
  const ok3 = !ask3 || stars > 0;
  let n = 0;

  async function submit() {
    setSending(true);
    setError(null);
    try {
      if (ask1) await api(`/jobs/${id}/complete`, { method: 'POST', body: { onTime } });
      if (ask2) await api(`/jobs/${id}/payment`, { method: 'POST', body: { amount } });
      if (ask3) await api(`/jobs/${id}/review`, { method: 'POST', body: { stars, comment: comment.trim() || undefined } });
      setDone(true);
    } catch (err) {
      setError(err);
      // reload, so questions already saved are skipped next time
      api(`/jobs/${id}`).then((d) => setJob(d.job)).catch(() => {});
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <main className="thanks">
        <Ico icon={Confetti} tone="saffron" size={64} box={110} className="pop-in" />
        <h1>{t('thanks')}</h1>
        <p style={{ fontWeight: 600, fontSize: 18 }}>{t('thanksNote', { name })}</p>
        <Link to="/" className="btn btn--henna"><HouseLine size={26} weight="duotone" /><Say k="backHome" /></Link>
        <Link to={`/jobs/${id}`} className="btn btn--ghost btn--small"><ClipboardText size={22} weight="duotone" />{t('seeJob')}</Link>
      </main>
    );
  }

  return (
    <>
      <TopBar title={t('finishTitle')} sub={t('finishSub')} back={`/jobs/${id}`} />

      <main className="page">
        {ask1 && (
          <section className="card qcard">
            <h2 className="q"><Num n={(n += 1)} done={ok1} /><Say k="onTimeQ" vars={{ name }} /></h2>
            <div className="choice-grid">
              <button type="button" className="choice yes" aria-pressed={onTime === true} onClick={() => setOnTime(true)}>
                <Ico icon={Clock} tone="leaf" size={34} box={58} />
                <Say k="onTimeYes" className="center" />
              </button>
              <button type="button" className="choice no" aria-pressed={onTime === false} onClick={() => setOnTime(false)}>
                <Ico icon={Timer} tone="chilli" size={34} box={58} />
                <Say k="onTimeNo" className="center" />
              </button>
            </div>
          </section>
        )}

        {ask2 && (
          <section className="card qcard">
            <h2 className="q"><Num n={(n += 1)} done={ok2} /><Say k="cashQ" /></h2>
            <div className="box saffron row spread">
              <span style={{ fontWeight: 800 }}>{t('agreedPrice')}</span>
              <span className="big-amount" style={{ fontSize: 30 }}>{rupees(job.total)}</span>
            </div>
            <div className="choice-grid">
              <button type="button" className="choice yes" aria-pressed={paidSame === true} onClick={() => setPaidSame(true)}>
                <Ico icon={Money} tone="leaf" size={34} box={58} />
                <Say k="yesAmount" vars={{ amount: rupees(job.total) }} className="center" />
              </button>
              <button type="button" className="choice" aria-pressed={paidSame === false} onClick={() => setPaidSame(false)}>
                <Ico icon={Money} tone="saffron" size={34} box={58} />
                <Say k="diffAmount" className="center" />
              </button>
            </div>
            {paidSame === false && (
              <label className="field">
                <span className="field-label"><span>{t('typeAmount')}</span></span>
                <input className="input" type="text" inputMode="numeric" value={other} autoFocus
                  onChange={(e) => setOther(e.target.value.replace(/\D/g, '').slice(0, 7))} />
              </label>
            )}
          </section>
        )}

        {ask3 && (
          <section className="card qcard">
            <h2 className="q"><Num n={(n += 1)} done={ok3} /><Say k="rateQ" /></h2>
            <div className="star-input" role="radiogroup">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" role="radio" aria-checked={stars === s} aria-label={`${s}`}
                  className={`star-btn ${s <= stars ? 'on' : ''}`} onClick={() => setStars(s)}>
                  <Star size={50} weight={s <= stars ? 'fill' : 'duotone'} />
                </button>
              ))}
            </div>
            <div className="star-word">{stars > 0 && <Say k={`star${stars}`} className="center" />}</div>
            <label className="field">
              <span className="field-label" style={{ fontSize: 16 }}><span>{t('anythingToSay')} <span className="muted">({t('canSkip')})</span></span></span>
              <textarea className="input" rows={2} value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} />
            </label>
            <div className="box note">
              <Ico icon={EyeSlash} tone="ink" size={22} />
              <span>{t('ratingHidden', { name })}</span>
            </div>
          </section>
        )}

        <ErrorBox>{error && errorText(error, L)}</ErrorBox>
      </main>

      <div className="sticky-bar">
        <button type="button" className="btn" disabled={!(ok1 && ok2 && ok3) || sending} onClick={submit}>
          <Check size={26} weight="bold" /><Say k="done" />
        </button>
      </div>
    </>
  );
}

function Num({ n, done }) {
  return <span className={`qnum ${done ? 'done' : ''}`}>{done ? <Check size={18} weight="bold" /> : n}</span>;
}
