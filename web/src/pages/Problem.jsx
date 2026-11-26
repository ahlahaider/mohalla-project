// "Something wrong?" — opens a dispute on the job.
// The admin decides only from the record (agreement, bills, payment answers),
// so this form just asks what kind of problem it was and what happened.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserMinus, Scales, Money, ShieldWarning, PaperPlaneTilt, Info } from '@phosphor-icons/react';
import { api, errorText } from '../api.js';
import { useLang } from '../i18n.jsx';
import { firstName } from '../prefs.js';
import { TopBar, Ico, Say, Loading, ErrorBox } from '../ui/kit.jsx';

const TYPES = [
  { key: 'no-show', icon: UserMinus, tone: 'saffron' },
  { key: 'scope', icon: Scales, tone: 'henna' },
  { key: 'non-payment', icon: Money, tone: 'leaf' },
  { key: 'misconduct', icon: ShieldWarning, tone: 'chilli' },
];

export default function Problem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const L = useLang();
  const { t } = L;
  const [job, setJob] = useState(null);
  const [type, setType] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { api(`/jobs/${id}`).then((d) => setJob(d.job)).catch(setError); }, [id]);

  if (!job) return <><TopBar title="" />{error ? <main className="page"><ErrorBox>{errorText(error, L)}</ErrorBox></main> : <Loading />}</>;
  const name = firstName(job.worker?.name || '');

  async function send() {
    setSending(true);
    setError(null);
    try {
      await api(`/jobs/${id}/disputes`, { method: 'POST', body: { type, text: text.trim() } });
      navigate(`/jobs/${id}`, { replace: true });
    } catch (err) {
      setError(err);
      setSending(false);
    }
  }

  return (
    <>
      <TopBar title={t('problemTitle')} sub={t('problemSub')} back={`/jobs/${id}`} />
      <main className="page">
        <div className="stack">
          {TYPES.map((x) => (
            <button key={x.key} type="button" className="area-option" style={{ minHeight: 66 }} aria-pressed={type === x.key} onClick={() => setType(x.key)}>
              <Ico icon={x.icon} tone={x.tone} size={26} box={46} />
              <Say k={`d_${x.key}`} vars={{ name }} />
            </button>
          ))}
        </div>

        {type === 'misconduct' && (
          <div className="box chilli note">
            <Ico icon={ShieldWarning} tone="chilli" size={22} />
            <span>{t('misconductNote', { name })}</span>
          </div>
        )}

        <label className="field">
          <span className="field-label"><Say k="tellWhat" /></span>
          <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} />
        </label>

        <div className="box note">
          <Ico icon={Info} tone="ink" size={22} />
          <span>{t('within48')}</span>
        </div>

        <ErrorBox>{error && errorText(error, L)}</ErrorBox>
      </main>

      <div className="sticky-bar">
        <button type="button" className="btn btn--henna" disabled={!type || !text.trim() || sending} onClick={send}>
          <PaperPlaneTilt size={26} weight="duotone" /><Say k="sendReport" />
        </button>
      </div>
    </>
  );
}
