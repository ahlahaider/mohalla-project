// A worker's public page: who they are, who vouches for them, reviews,
// and the form to request them.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, rupees } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { Badges, Reliability, JobForm, initials } from '../components/bits.jsx';

export default function WorkerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, cat, icon, areaName } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api(`/workers/${id}`).then(setData).catch((e) => setError(e.message)); }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return null;
  const { worker, reviews, vouchedBy } = data;
  const p = worker.workerProfile || {};

  return (
    <>
      <div className="card row" style={{ alignItems: 'flex-start' }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>{initials(worker.name)}</div>
        <div style={{ flex: 1 }}>
          <h1>{worker.name}</h1>
          <div className="row" style={{ gap: 6 }}>
            {p.skills?.map((s) => <span key={s} className="chip">{icon(s)} {cat(s)}</span>)}
            <Badges badges={worker.badges} />
          </div>
          <p className="muted" style={{ marginTop: 6 }}>{p.areasServed?.map(areaName).join(', ')} · {rupees(p.priceMin)} – {rupees(p.priceMax)}</p>
          <Reliability reliability={worker.reliability} rating={worker.rating} />
          {p.bio && <p style={{ marginTop: 8 }}>{p.bio}</p>}
          {vouchedBy.length > 0 && (
            <p className="muted">{t('vouchedBy')} {vouchedBy.map((v) => v.name + (v.founding ? ' ★' : '')).join(', ')}</p>
          )}
        </div>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2>{t('requestWorker')}</h2>
          {user?.role === 'customer'
            ? <JobForm categories={p.skills || []} defaultArea={user.area} workerId={worker.id}
                submitLabel={t('sendRequest')} onDone={(job) => navigate(`/jobs/${job.id}`)} />
            : <Link className="btn primary" to="/login">{t('loginToRequest')}</Link>}
        </div>

        <div className="card">
          <h2>{t('reviews')}</h2>
          {reviews.length === 0 && <p className="muted">{t('noReviews')}</p>}
          {reviews.map((r, i) => (
            <div key={i} className="entry" style={{ display: 'block' }}>
              <strong>{'★'.repeat(r.stars)}</strong> <span className="muted">{r.from}</span>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
