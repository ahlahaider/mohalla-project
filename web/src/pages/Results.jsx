// Screen 2 · Results: workers for one service, near the chosen area. No account needed.
// Filters are big on/off chips. "Free today" and "Women workers" ask the API;
// "Low price" and "Top rated" just re-order the list on the phone.
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Sun, GenderFemale, Tag, Star, ShieldCheck, Storefront, Handshake, Sparkle, CaretRight, MapPin, MagnifyingGlass, Megaphone,
} from '@phosphor-icons/react';
import { api, errorText, rupees } from '../api.js';
import { useLang } from '../i18n.jsx';
import { useArea, firstName } from '../prefs.js';
import { CATEGORY } from '../ui/icons.js';
import { TopBar, Ico, Say, Avatar, Loading, ErrorBox, AreaSheet } from '../ui/kit.jsx';

const FILTERS = [
  { key: 'free', k: 'fFree', icon: Sun },
  { key: 'women', k: 'fWomen', icon: GenderFemale },
  { key: 'cheap', k: 'fCheap', icon: Tag },
  { key: 'top', k: 'fTop', icon: Star },
];

export default function Results() {
  const { category } = useParams();
  const L = useLang();
  const { t, cat, areaName } = L;
  const [area, setArea] = useArea();
  const [picking, setPicking] = useState(false);
  const [on, setOn] = useState({});
  const [workers, setWorkers] = useState(null);
  const [error, setError] = useState(null);

  const service = CATEGORY[category];

  // Ask the API again whenever the area or a server-side filter changes.
  useEffect(() => {
    if (!service) return;
    const q = new URLSearchParams({ category });
    if (area) q.set('area', area);
    if (on.free) q.set('available', 'true');
    if (on.women) q.set('female', 'true');
    setWorkers(null);
    setError(null);
    api(`/workers?${q}`).then((d) => setWorkers(d.workers)).catch(setError);
  }, [category, area, on.free, on.women, service]);

  // Re-order on the phone for "Low price" / "Top rated".
  const shown = useMemo(() => {
    if (!workers) return null;
    const list = [...workers];
    if (on.cheap) list.sort((a, b) => (a.workerProfile?.priceMin ?? 1e9) - (b.workerProfile?.priceMin ?? 1e9));
    if (on.top) list.sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0));
    return list;
  }, [workers, on.cheap, on.top]);

  if (!service) return <Navigate to="/" replace />;

  const toggle = (key) => setOn((f) => {
    const next = { ...f, [key]: !f[key] };
    if (key === 'cheap' && next.cheap) next.top = false; // only one way of ordering at a time
    if (key === 'top' && next.top) next.cheap = false;
    return next;
  });

  return (
    <>
      <TopBar
        back="/"
        title={<span className="row" style={{ gap: 8 }}><Ico icon={service.icon} tone={category} size={22} box={36} />{cat(category)}</span>}
        sub={
          <button type="button" className="link-btn" style={{ padding: 0, minHeight: 0, fontSize: 15 }} onClick={() => setPicking(true)}>
            <MapPin size={16} weight="fill" />
            {area ? t('nearArea', { area: areaName(area) }) : t('allAreas')}
          </button>
        }
      />

      <main className="page">
        <div className="chips chips--grid" role="group">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={Boolean(on[f.key])} onClick={() => toggle(f.key)}>
              <Ico icon={f.icon} tone="ink" size={20} />
              <Say k={f.k} />
            </button>
          ))}
        </div>

        <ErrorBox>{error && errorText(error, L)}</ErrorBox>
        {!shown && !error && <Loading />}

        {shown && shown.length > 0 && <p className="muted" style={{ fontWeight: 700 }}>{t('found', { n: shown.length })}</p>}

        {shown?.length === 0 && (
          <div className="empty card">
            <Ico icon={MagnifyingGlass} tone="saffron" size={44} />
            <h2 className="q" style={{ justifyContent: 'center' }}><Say k="noneFound" className="center" /></h2>
            <p className="muted">{t('noneHint')}</p>
            <div className="btn-row" style={{ width: '100%' }}>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setPicking(true)}>{t('change')}</button>
              {Object.values(on).some(Boolean) && (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setOn({})}>{t('clearFilters')}</button>
              )}
            </div>
          </div>
        )}

        {shown?.map((w, i) => <WorkerCard key={w.id} worker={w} category={category} i={i} />)}

        {/* Or let workers come to you: post the job, nearby workers send prices. */}
        {shown && (
          <Link to={`/find/${category}/post`} className="door moves" style={{ boxShadow: '0 0 0 2px var(--leaf), 0 5px 0 2px var(--leaf)', background: 'var(--leaf-tint)' }}>
            <Ico icon={Megaphone} tone="leaf" size={30} box={56} motion="wiggle" />
            <span className="door-text">
              <Say k="postCardTitle" className="door-title" />
              <span className="door-hint" style={{ color: 'var(--leaf-deep)' }}>{t('postCardHint')}</span>
            </span>
            <CaretRight size={24} weight="bold" />
          </Link>
        )}
      </main>

      <AreaSheet open={picking} current={area} onClose={() => setPicking(false)} onPick={(a) => { setArea(a); setPicking(false); }} />
    </>
  );
}

// One worker in the list. The whole card is one big tap target.
export function WorkerBadges({ worker }) {
  const { t } = useLang();
  const female = worker.workerProfile?.gender === 'female';
  const voucher = worker.vouchedBy?.[0];
  return (
    <div className="badges">
      {worker.badges?.verified && <span className="badge leaf"><ShieldCheck size={16} weight="fill" />{t('bVerified')}</span>}
      {worker.badges?.founding && <span className="badge saffron"><Storefront size={16} weight="fill" />{t('bFounding')}</span>}
      {voucher && <span className="badge henna"><Handshake size={16} weight="fill" />{t('bTrusts', { name: firstName(voucher.name), him: t(female ? 'her' : 'him') })}</span>}
      {worker.reliability?.isNew && <span className="badge saffron"><Sparkle size={16} weight="fill" />{t('bNew')}</span>}
    </div>
  );
}

function WorkerCard({ worker, category, i }) {
  const { t } = useLang();
  const p = worker.workerProfile || {};
  return (
    <Link to={`/workers/${worker.id}?cat=${category}`} className="card worker-card rise-in" style={{ '--i': i }}>
      <div className="head">
        <Avatar name={worker.name} photoUrl={worker.photoUrl} />
        <div style={{ minWidth: 0 }}>
          <h3>{worker.name}</h3>
          <WorkerBadges worker={worker} />
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          {worker.rating
            ? <><b><Star size={18} weight="fill" color="var(--saffron)" />{worker.rating.avg}</b><span>{worker.rating.count === 1 ? t('review1') : t('reviewsN', { n: worker.rating.count })}</span></>
            : <><b>—</b><span>{t('noReviewsYet')}</span></>}
        </div>
        <div className="stat"><b>{worker.reliability?.completed ?? 0}</b><span>{t('jobsDone')}</span></div>
        <div className="stat"><b>{rupees(p.priceMin)}</b><span>{t('startsFrom')}</span></div>
      </div>

      <div className="card-foot">
        {p.availableToday ? <span className="free"><span className="dot" />{t('fFree')}</span> : <span />}
        <span className="more">{t('seeMore')} <CaretRight size={18} weight="bold" /></span>
      </div>
    </Link>
  );
}
