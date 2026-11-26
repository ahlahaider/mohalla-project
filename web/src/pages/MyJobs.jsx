import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import { StatusChip } from '../components/bits.jsx';

export default function MyJobs() {
  const { t, cat, icon, areaName } = useLang();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/jobs/mine').then((d) => setJobs(d.jobs)).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <h1>{t('myJobs')}</h1>
      {error && <p className="error">{error}</p>}
      {jobs?.length === 0 && <p className="muted">{t('noJobs')} <Link to="/">{t('findHelp')}</Link></p>}
      {jobs?.map((j) => (
        <Link key={j.id} to={`/jobs/${j.id}`} className="card row spread" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div>
            <h3 style={{ margin: 0 }}>{icon(j.category)} {cat(j.category)} {j.worker && <span className="muted">· {j.worker}</span>}</h3>
            <p className="muted" style={{ margin: 0 }}>{j.description.slice(0, 80)} · {areaName(j.area)}</p>
          </div>
          <div className="row">
            {j.needsMe && <span className="chip red">{t('needsYou')}</span>}
            {j.total > 0 && <strong>{rupees(j.total)}</strong>}
            <StatusChip status={j.status} />
          </div>
        </Link>
      ))}
    </>
  );
}
