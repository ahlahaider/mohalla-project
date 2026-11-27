// My jobs: jobs still moving on top, finished ones below.
// A red "Needs your OK" tag shows where the customer has to answer a price.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardText, MagnifyingGlass } from '@phosphor-icons/react';
import { api, errorText, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import { firstName } from '../prefs.js';
import { CATEGORY } from '../ui/icons.js';
import { Ico, Say, Loading, ErrorBox, BottomNav } from '../ui/kit.jsx';
import { jobStatus, whenText } from './JobPage.jsx';

const MOVING = ['open', 'requested', 'accepted', 'agreed'];

export default function MyJobs() {
  const L = useLang();
  const { t } = L;
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api('/jobs/mine').then((d) => setJobs(d.jobs)).catch(setError); }, []);

  const now = jobs?.filter((j) => MOVING.includes(j.status)) || [];
  const before = jobs?.filter((j) => !MOVING.includes(j.status)) || [];
  const waiting = jobs?.filter((j) => j.needsMe).length || 0;

  return (
    <>
      <header className="topbar">
        <Ico icon={ClipboardText} tone="henna" size={26} box={48} />
        <div className="titles"><h1><Say k="navJobs" /></h1></div>
      </header>

      <main className="page">
        <ErrorBox>{error && errorText(error, L)}</ErrorBox>
        {!jobs && !error && <Loading />}

        {jobs?.length === 0 && (
          <div className="empty card">
            <Ico icon={MagnifyingGlass} tone="saffron" size={44} />
            <h2 className="q"><Say k="noJobs" className="center" /></h2>
            <p className="muted">{t('noJobsHint')}</p>
            <Link to="/" className="btn btn--henna"><Say k="findWorker" /></Link>
          </div>
        )}

        {now.length > 0 && <List label={t('jobsNow')} jobs={now} />}
        {before.length > 0 && <List label={t('jobsBefore')} jobs={before} />}

      </main>
      <BottomNav waiting={waiting} />
    </>
  );
}

function List({ label, jobs }) {
  const { t, cat } = useLang();
  return (
    <section className="stack">
      <div className="section-label">{label}</div>
      {jobs.map((j, i) => {
        const svc = CATEGORY[j.category];
        const st = jobStatus(j);
        const name = firstName(j.worker || '');
        return (
          <Link key={j.id} to={`/jobs/${j.id}`} className="card job-row rise-in" style={{ '--i': i }}>
            {svc && <Ico icon={svc.icon} tone={j.category} size={30} box={54} />}
            <div className="info">
              <b>{j.description.split('. ')[0]}</b>
              <div className="muted">{[name, cat(j.category), whenText(j.preferredTime, t)].filter(Boolean).join(' · ')}</div>
            </div>
            <div className="side">
              {j.needsMe ? <span className="tag chilli">{j.status === 'open' ? t(j.quotesCount === 1 ? 'price1' : 'pricesN', { n: j.quotesCount }) : t('needsYou')}</span> : <span className={`tag ${st.tone}`}>{t(st.k, { name })}</span>}
              {j.total > 0 && <b>{rupees(j.total)}</b>}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
