// Screen 5 · Ask a worker to come: 3 questions, all answered by tapping.
// With `posted`, the same form posts the job for every worker nearby to send a price
// (/find/:category/post) instead of asking one worker.
//   1. What is the problem?  (chips for this service, plus optional words)
//   2. When?                  (today / tomorrow / day after + morning / afternoon / evening)
//   3. Where?                 (area + house address, hidden until the worker says yes)
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Check, SunHorizon, Sun, MoonStars, CalendarBlank, MapPin, Lock, PaperPlaneTilt, Question,
} from '@phosphor-icons/react';
import { api, errorText } from '../api.js';
import { useLang, PROBLEMS } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { useArea, firstName } from '../prefs.js';
import { CATEGORY } from '../ui/icons.js';
import { TopBar, Ico, Say, Pair, Avatar, Loading, ErrorBox, AreaSheet, PhotoPicker } from '../ui/kit.jsx';

// Each time slot starts and ends at these hours (24-hour clock).
const SLOTS = [
  { key: 'morning', icon: SunHorizon, from: 9, to: 12, label: '9 – 12' },
  { key: 'afternoon', icon: Sun, from: 12, to: 16, label: '12 – 4' },
  { key: 'evening', icon: MoonStars, from: 16, to: 20, label: '4 – 8' },
];
const DAYS = ['today', 'tomorrow', 'dayAfter'];

const dayDate = (offset) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};
const slotPassed = (dayIndex, slot) => dayIndex === 0 && new Date().getHours() >= slot.to;

export default function RequestForm({ posted = false }) {
  const { id, category: postCategory } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const L = useLang();
  const { t, cat, catU, pick, pickU, areaName, areaU } = L;
  const [area, setArea] = useArea();

  const [worker, setWorker] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [category, setCategory] = useState(posted ? postCategory : null);
  const [problem, setProblem] = useState(null); // index into PROBLEMS[category], or 'other'
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState([]); // optional photos of the problem ("/api/photos/…")
  const [day, setDay] = useState(() => (SLOTS.every((s) => slotPassed(0, s)) ? 1 : null));
  const [slot, setSlot] = useState(null);
  const [address, setAddress] = useState(user?.address || ''); // the saved address from Me → My details
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (posted) return;
    api(`/workers/${id}`).then(({ worker: w }) => {
      setWorker(w);
      const skills = w.workerProfile?.skills || [];
      setCategory(skills.includes(params.get('cat')) ? params.get('cat') : skills[0]);
    }).catch(setLoadError);
  }, [id, params, posted]);
  useEffect(() => { if (!area && user?.area) setArea(user.area); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const name = worker ? firstName(worker.name) : '';
  const problems = PROBLEMS[category] || [];

  const description = useMemo(() => {
    const chosen = typeof problem === 'number' ? problems[problem]?.[0] : '';
    return [chosen, details.trim()].filter(Boolean).join('. ');
  }, [problem, problems, details]);

  const done1 = Boolean(description) && (problem !== 'other' || details.trim());
  const done2 = day != null && slot != null;
  const done3 = Boolean(area) && address.trim().length >= 3;
  const ready = done1 && done2 && done3;

  async function send() {
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    const s = SLOTS.find((x) => x.key === slot);
    const when = dayDate(day);
    when.setHours(s.from);
    try {
      const { job } = await api('/jobs', {
        method: 'POST',
        body: posted
          ? { mode: 'quotes', category, description, area, address: address.trim(), preferredTime: when.toISOString(), photos }
          : { mode: 'direct', workerId: id, category, description, area, address: address.trim(), preferredTime: when.toISOString(), photos },
      });
      navigate(`/jobs/${job.id}`, { replace: true });
    } catch (err) {
      setError(err);
      setSending(false);
    }
  }

  if (loadError) return <><TopBar title="" /><main className="page"><ErrorBox>{errorText(loadError, L)}</ErrorBox></main></>;
  if (!worker && !posted) return <><TopBar title="" /><Loading /></>;
  if (posted && !CATEGORY[category]) return <><TopBar title="" /><main className="page"><ErrorBox>{t('somethingWentWrong')}</ErrorBox></main></>;

  const skills = posted ? [] : worker.workerProfile?.skills || [];

  return (
    <>
      {posted
        ? <TopBar title={t('postTitle')} sub={`${cat(category)} · ${t('postSub')}`} right={<Ico icon={CATEGORY[category].icon} tone={category} size={26} box={46} />} />
        : <TopBar title={t('askToCome', { name })} sub={t('quickQs')} right={<Avatar name={worker.name} photoUrl={worker.photoUrl} size={48} />} />}

      <main className="page">
        {/* 1 · problem */}
        <section className="card qcard">
          <h2 className="q"><Num n={1} done={done1} /><Say k="q1" /></h2>

          {skills.length > 1 && (
            <div className="chips" aria-label={t('whichService')}>
              {skills.map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={s === category} onClick={() => { setCategory(s); setProblem(null); }}>
                  <Ico icon={CATEGORY[s].icon} tone={s} size={20} />
                  <Pair main={cat(s)} ur={catU(s)} />
                </button>
              ))}
            </div>
          )}

          <div className="chips">
            {problems.map((row, i) => (
              <button key={row[0]} type="button" className="chip no-icon" aria-pressed={problem === i} onClick={() => setProblem(i)}>
                {problem === i && <Check size={20} weight="bold" />}
                <Pair main={pick(row)} ur={pickU(row)} />
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={problem === 'other'} onClick={() => setProblem('other')}>
              <Ico icon={Question} tone="ink" size={20} />
              <Say k="probOther" />
            </button>
          </div>

          <label className="field">
            <span className="field-label" style={{ fontSize: 16 }}>
              <span>{t('sayMore')} {problem !== 'other' && <span className="muted">({t('canSkip')})</span>}</span>
            </span>
            <textarea className="input" rows={2} value={details} onChange={(e) => setDetails(e.target.value.slice(0, 600))}
              placeholder={problem === 'other' ? '' : 'e.g. the ceiling fan in the bedroom'} />
          </label>
          <div className="field">
            <span className="field-label" style={{ fontSize: 16 }}><span>{t('photoProblem')} <span className="muted">({t('canSkip')})</span></span></span>
            <PhotoPicker photos={photos} onChange={setPhotos} label="addPhoto" />
          </div>
        </section>

        {/* 2 · when */}
        <section className="card qcard">
          <h2 className="q"><Num n={2} done={done2} />{posted ? <Say k="q2any" /> : <Say k="q2" vars={{ name }} />}</h2>
          <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {DAYS.map((k, i) => {
              const d = dayDate(i);
              const allGone = SLOTS.every((s) => slotPassed(i, s));
              return (
                <button key={k} type="button" className="choice" style={{ minHeight: 104, padding: '10px 4px' }}
                  aria-pressed={day === i} disabled={allGone}
                  onClick={() => { setDay(i); if (slot && slotPassed(i, SLOTS.find((s) => s.key === slot))) setSlot(null); }}>
                  <span className="row" style={{ gap: 4, color: 'var(--ink-3)' }}>
                    <CalendarBlank size={18} weight="bold" />
                    <span style={{ fontSize: 14 }}>{d.toLocaleDateString('en-PK', { weekday: 'short' })}</span>
                  </span>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{d.getDate()}</span>
                  <Say k={k} className="center" />
                </button>
              );
            })}
          </div>
          <div className="chips">
            {SLOTS.map((s) => {
              const gone = day != null && slotPassed(day, s);
              return (
                <button key={s.key} type="button" className="chip" aria-pressed={slot === s.key} disabled={gone} onClick={() => setSlot(s.key)}>
                  <Ico icon={s.icon} tone={s.key === 'evening' ? 'ink' : 'saffron'} size={20} />
                  <span className="say">
                    <span className="say-main">{t(s.key)} <span style={{ fontWeight: 600, opacity: 0.8 }}>{s.label}</span></span>
                    <span className="ur" dir="rtl">{gone ? L.u('slotPassed') : L.u(s.key)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3 · where */}
        <section className="card qcard">
          <h2 className="q"><Num n={3} done={done3} /><Say k="q3" /></h2>
          <button type="button" className="chip" aria-pressed={Boolean(area)} onClick={() => setPicking(true)}>
            <Ico icon={MapPin} tone="henna" size={20} />
            {area ? <Pair main={areaName(area)} ur={areaU(area)} /> : <Say k="pickArea" />}
            <span style={{ textDecoration: 'underline', fontSize: 15, marginLeft: 6 }}>{t('change')}</span>
          </button>
          <textarea className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value.slice(0, 300))}
            placeholder="House number, street, nearby landmark" />
          <div className="box leaf note">
            <Ico icon={Lock} tone="leaf" size={22} />
            <span>{posted ? t('addressHiddenAny') : t('addressHidden', { name })}</span>
          </div>
        </section>

        <ErrorBox>{error && errorText(error, L)}</ErrorBox>
      </main>

      <div className="sticky-bar">
        <button type="button" className="btn moves" disabled={!ready || sending} onClick={send}>
          <Ico icon={PaperPlaneTilt} tone="cream" size={26} box={38} motion="drive" />
          {posted ? <Say k="postSend" /> : <Say k="sendTo" vars={{ name }} />}
        </button>
        <p className="muted center" style={{ marginTop: 8 }}>{!ready ? t('answerAll') : posted ? t('postNote') : t('sendNote', { name })}</p>
      </div>

      <AreaSheet open={picking} current={area} onClose={() => setPicking(false)} onPick={(a) => { setArea(a); setPicking(false); }} />
    </>
  );
}

function Num({ n, done }) {
  return <span className={`qnum ${done ? 'done' : ''}`}>{done ? <Check size={18} weight="bold" /> : n}</span>;
}
