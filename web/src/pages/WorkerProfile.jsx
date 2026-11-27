// Screen 3 · Worker profile. No account needed to look.
// "Ask [name] to come" is the only place (with My jobs) that asks you to log in.
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Star, ShieldCheck, Storefront, Handshake, Sparkle, HandWaving, ChatCircleText } from '@phosphor-icons/react';
import { api, errorText, rupees } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { firstName } from '../prefs.js';
import { TopBar, Ico, Say, Avatar, Loading, ErrorBox, StarsShow } from '../ui/kit.jsx';

export default function WorkerProfile() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const L = useLang();
  const { t, cat, areaName } = L;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api(`/workers/${id}`).then(setData).catch(setError); }, [id]);

  if (error) return <><TopBar title="" /><main className="page"><ErrorBox>{error.status === 404 ? t('workerNotFound') : errorText(error, L)}</ErrorBox></main></>;
  if (!data) return <><TopBar title="" /><Loading /></>;

  const { worker, reviews, vouchedBy } = data;
  const p = worker.workerProfile || {};
  const name = firstName(worker.name);
  const female = p.gender === 'female';
  const his = t(female ? 'hers' : 'his');
  const rel = worker.reliability || {};
  // The service they came from (results page), else the worker's first skill.
  const category = p.skills?.includes(params.get('cat')) ? params.get('cat') : p.skills?.[0];

  const ask = () => {
    const target = `/workers/${id}/request?cat=${category}`;
    if (user) navigate(target);
    else navigate(`/login?returnTo=${encodeURIComponent(target)}&for=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <TopBar title={worker.name} sub={p.skills?.map(cat).join(' · ')} />

      <main className="page">
        <div className="profile-head">
          <Avatar name={worker.name} photoUrl={worker.photoUrl} />
          <h1>{worker.name}</h1>
          <div className="muted" style={{ fontWeight: 700 }}>
            {p.skills?.map(cat).join(', ')} · {p.areasServed?.map(areaName).join(', ')}
          </div>
          {p.availableToday && <span className="tag leaf"><span className="dot" style={{ background: '#fff' }} />{t('fFree')}</span>}
        </div>

        <div className="stats">
          <div className="stat card" style={{ padding: '12px 6px' }}>
            {worker.rating
              ? <><b><Star size={20} weight="fill" color="var(--saffron)" />{worker.rating.avg}</b><span>{worker.rating.count === 1 ? t('person1Rated') : t('peopleRated', { n: worker.rating.count })}</span></>
              : <><b>—</b><span>{t('noReviewsYet')}</span></>}
          </div>
          <div className="stat card" style={{ padding: '12px 6px' }}>
            {rel.isNew
              ? <><b>{rel.completed}</b><span>{t('jobsFinished')}</span></>
              : <><b>{rel.completed}<small style={{ fontSize: 15, color: 'var(--ink-3)' }}>/{rel.accepted}</small></b><span>{t('jobsFinished')}</span></>}
          </div>
          <div className="stat card" style={{ padding: '12px 6px' }}>
            <b>{rel.onTimePct != null ? `${rel.onTimePct}%` : '—'}</b><span>{t('cameOnTime')}</span>
          </div>
        </div>

        {(worker.badges?.verified || worker.badges?.founding || rel.isNew || vouchedBy.length > 0) && (
          <section className="card stack">
            {worker.badges?.verified && <BadgeLine icon={ShieldCheck} tone="leaf" title={t('bVerified')} text={t('verifiedLong', { his })} />}
            {worker.badges?.founding && <BadgeLine icon={Storefront} tone="saffron" title={t('bFounding')} text={t('foundingLong')} />}
            {vouchedBy.map((v) => (
              <BadgeLine key={v.id} icon={Handshake} tone="henna" title={`${t('trustedBy')}: ${v.name}`} text={t('trustedByLong', { name: firstName(v.name), his: t('his') })} />
            ))}
            {rel.isNew && <BadgeLine icon={Sparkle} tone="saffron" title={t('bNew')} text={t('newLong')} />}
          </section>
        )}

        <section className="box henna">
          <div className="section-label">{t('usualPrice')}</div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 6px' }}>{rupees(p.priceMin)} – {rupees(p.priceMax).replace('Rs ', '')}</div>
          <p style={{ fontWeight: 600 }}>{t('priceHow', { name })}</p>
        </section>

        <section className="stack">
          <h2 className="q"><Ico icon={ChatCircleText} tone="ink" size={22} box={36} /><Say k="whatPeopleSaid" /></h2>
          {reviews.length === 0 && <p className="muted">{t('noReviews')}</p>}
          {reviews.map((r, i) => (
            <div key={i} className="review">
              <div className="who"><span>{r.from}</span><StarsShow value={r.stars} /></div>
              {r.comment && <p style={{ marginTop: 4, fontWeight: 600 }}>{r.comment}</p>}
            </div>
          ))}
        </section>
      </main>

      <div className="sticky-bar">
        {user && user.role !== 'customer'
          ? <p className="muted center">{t('customersOnly', { role: user.role })}</p>
          : (
            <button type="button" className="btn btn--henna moves" onClick={ask}>
              <Ico icon={HandWaving} tone="cream" size={28} box={40} motion="wiggle" />
              <Say k="askToCome" vars={{ name }} />
            </button>
          )}
      </div>
    </>
  );
}

function BadgeLine({ icon, tone, title, text }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
      <Ico icon={icon} tone={tone} size={24} />
      <div>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div className="muted" style={{ fontWeight: 600 }}>{text}</div>
      </div>
    </div>
  );
}

