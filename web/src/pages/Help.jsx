// Help: how Mohalla works in 4 pictures, and a call button once the team has a help line.
import { Lifebuoy, Phone, UserCircleCheck, Handshake, Money, Warning } from '@phosphor-icons/react';
import { useLang } from '../i18n.jsx';
import { HELP_PHONE } from '../prefs.js';
import { Ico, Say, BottomNav } from '../ui/kit.jsx';

export default function Help() {
  const { t } = useLang();
  return (
    <>
      <header className="topbar">
        <Ico icon={Lifebuoy} tone="henna" size={26} box={48} />
        <div className="titles"><h1><Say k="navHelp" /></h1></div>
      </header>
      <main className="page">
        <section className="card how">
          <div className="section-label">{t('howTitle')}</div>
          {[
            ['how1', UserCircleCheck, 'henna'],
            ['how2', Handshake, 'leaf'],
            ['how3', Money, 'saffron'],
            ['how4', Warning, 'chilli'],
          ].map(([k, icon, tone], i) => (
            <div key={k} className="how-row rise-in" style={{ '--i': i }}>
              <Ico icon={icon} tone={tone} size={28} box={52} />
              <Say k={k} />
            </div>
          ))}
        </section>
        {HELP_PHONE
          ? <a className="btn btn--saffron" href={`tel:${HELP_PHONE}`}><Phone size={26} weight="duotone" /><Say k="helpCall" /></a>
          : <p className="muted center">{t('helpNoPhone')}</p>}
      </main>
      <BottomNav />
    </>
  );
}
