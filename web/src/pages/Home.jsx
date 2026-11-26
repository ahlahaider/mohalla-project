// Screen 1 · Home. No account needed.
// Pick your area once (remembered on this phone), then tap a service.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Translate, UserCircleCheck, Handshake, Money, Lifebuoy } from '@phosphor-icons/react';
import { useLang } from '../i18n.jsx';
import { useArea } from '../prefs.js';
import { CATEGORIES } from '../ui/icons.js';
import { Say, Pair, Ico, BottomNav, AreaSheet } from '../ui/kit.jsx';

export default function Home() {
  const { t, lang, toggle, cat, catU, areaName, areaU } = useLang();
  const [area, setArea] = useArea();
  const [picking, setPicking] = useState(false);

  return (
    <>
      <header className="awning">
        <div className="awning-row">
          <div className="logo">
            mohalla
            <span className="ur" lang="ur">محلہ</span>
          </div>
          <button type="button" className="lang-btn" onClick={toggle}>
            <Translate size={20} weight="bold" />
            {lang === 'en' ? 'Roman Urdu' : 'English'}
          </button>
        </div>

        <button type="button" className="area-btn" onClick={() => setPicking(true)}>
          <Ico icon={MapPin} tone="cream" size={24} />
          {area ? <Pair main={areaName(area)} ur={areaU(area)} /> : <Say k="pickArea" />}
          <span className="change">{t('change')}</span>
        </button>
      </header>

      <main className="page" style={{ paddingTop: 30 }}>
        <h1 className="title"><Say k="homeQ" /></h1>

        <div className="cat-grid play-once">
          {CATEGORIES.map((c, i) => (
            <Link key={c.key} to={`/find/${c.key}`} className="cat-tile moves rise-in" style={{ '--i': i }}>
              <Ico icon={c.icon} tone={c.key} size={36} box={60} motion={c.motion} />
              <Pair main={cat(c.key)} ur={catU(c.key)} />
            </Link>
          ))}
        </div>

        <section className="card how">
          <div className="section-label">{t('howTitle')}</div>
          {[
            ['how1', UserCircleCheck, 'henna'],
            ['how2', Handshake, 'leaf'],
            ['how3', Money, 'saffron'],
            ['how4', Lifebuoy, 'chilli'],
          ].map(([k, icon, tone]) => (
            <div key={k} className="how-row">
              <Ico icon={icon} tone={tone} size={26} />
              <Say k={k} />
            </div>
          ))}
        </section>
      </main>

      <BottomNav />
      <AreaSheet open={picking} current={area} onClose={() => setPicking(false)} onPick={(a) => { setArea(a); setPicking(false); }} />
    </>
  );
}
