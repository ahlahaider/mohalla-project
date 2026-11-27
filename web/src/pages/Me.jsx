// "Me": the customer's settings (bottom bar). Each setting is its own small screen:
//   /me/details  name, home area, saved address
//   /me/pin      change PIN (current PIN, then the new one twice)
//   /me/phone    change mobile number (code sent to the new number)
//   /me/close    close my account
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserCircle, IdentificationCard, Key, Phone, Translate, Lifebuoy, SignOut, Trash, CaretRight, MapPin,
  CheckCircle, LockKey, Warning, Lock, X, ClipboardText, DeviceMobile, CaretLeft,
} from '@phosphor-icons/react';
import { api, errorText, prettyPhone } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { useArea } from '../prefs.js';
import { TopBar, Ico, Say, Pair, BottomNav, ErrorBox, AreaSheet, PinBoxes, Keypad, Avatar } from '../ui/kit.jsx';
import { ChannelStep, Head } from './Login.jsx';

function Row({ to, icon, tone = 'ink', k, hint, danger, i = 0 }) {
  const { t } = useLang();
  return (
    <Link to={to} className="door moves rise-in" style={{ '--i': i, minHeight: 76, ...(danger && { boxShadow: '0 0 0 2px var(--chilli-tint), 0 5px 0 2px var(--chilli-tint)' }) }}>
      <Ico icon={icon} tone={tone} size={24} box={46} motion="wiggle" />
      <span className="door-text">
        <Say k={k} className="door-title" />
        {hint && <span className="door-hint">{t(hint)}</span>}
      </span>
      <CaretRight size={22} weight="bold" color={danger ? 'var(--chilli-deep)' : undefined} />
    </Link>
  );
}

export default function Me() {
  const { t, lang, toggle } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <header className="topbar">
        <Ico icon={UserCircle} tone="henna" size={26} box={48} />
        <div className="titles"><h1><Say k="meTitle" /></h1></div>
      </header>
      <main className="page">
        <Link to="/me/details" className="card row" style={{ gap: 14 }}>
          <Avatar name={user.name} photoUrl={user.photoUrl} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 20 }}>{user.name}</b>
            <div className="muted" style={{ fontWeight: 700 }}>{prettyPhone(user.phone)}</div>
          </div>
          <CaretRight size={22} weight="bold" />
        </Link>

        <div className="stack">
          <Row i={0} to="/me/details" icon={IdentificationCard} tone="saffron" k="setDetails" hint="setDetailsHint" />
        </div>

        <div className="section-label">{t('accountSection')}</div>
        <div className="stack">
          <Row i={1} to="/me/pin" icon={Key} tone="henna" k="setPin" />
          <Row i={2} to="/me/phone" icon={Phone} tone="plumber" k="setPhone" />
          <button type="button" className="door moves" style={{ minHeight: 76 }} onClick={toggle}>
            <Ico icon={Translate} tone="ink" size={24} box={46} motion="wiggle" />
            <span className="door-text">
              <Say k="language" className="door-title" />
              <span className="door-hint">{lang === 'en' ? 'English → Roman Urdu' : 'Roman Urdu → English'}</span>
            </span>
          </button>
          <Row i={3} to="/help" icon={Lifebuoy} tone="saffron" k="navHelp" />
          <button type="button" className="door moves" style={{ minHeight: 76 }} onClick={() => { logout(); navigate('/', { replace: true }); }}>
            <Ico icon={SignOut} tone="ink" size={24} box={46} motion="wiggle" />
            <span className="door-text"><Say k="logout" className="door-title" /></span>
          </button>
          <Row i={4} to="/me/close" icon={Trash} tone="chilli" k="setClose" danger />
        </div>
      </main>
      <BottomNav />
    </>
  );
}

// ---------- My details ----------
export function MeDetails() {
  const L = useLang();
  const { t, areaName, areaU } = L;
  const { user, updateUser } = useAuth();
  const [, setRememberedArea] = useArea();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name || '');
  const [area, setArea] = useState(user.area || '');
  const [address, setAddress] = useState(user.address || '');
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const { user: u } = await api('/users/me', { method: 'PATCH', body: { name: name.trim(), area, address: address.trim() } });
      updateUser(u);
      if (u.area) setRememberedArea(u.area); // the home screen's area follows the saved one
      setSaved(true);
      setTimeout(() => navigate('/me'), 600);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <>
      <TopBar title={t('setDetails')} back="/me" />
      <main className="page">
        <label className="field">
          <span className="field-label"><Say k="yourNameLabel" /></span>
          <input className="input" value={name} maxLength={60} onChange={(e) => { setSaved(false); setName(e.target.value); }} />
        </label>
        <div className="field">
          <span className="field-label"><Say k="homeArea" /></span>
          <button type="button" className="chip" aria-pressed={Boolean(area)} onClick={() => setPicking(true)}>
            <Ico icon={MapPin} tone="henna" size={20} />
            {area ? <Pair main={areaName(area)} ur={areaU(area)} /> : <Say k="pickArea" />}
            <span style={{ textDecoration: 'underline', fontSize: 15, marginLeft: 6 }}>{t('change')}</span>
          </button>
        </div>
        <label className="field">
          <span className="field-label"><Say k="savedAddress" /></span>
          <textarea className="input" rows={2} value={address} maxLength={300} placeholder="House number, street, nearby landmark"
            onChange={(e) => { setSaved(false); setAddress(e.target.value); }} />
          <span className="muted small">{t('savedAddressHint')}</span>
        </label>
        <ErrorBox>{error && errorText(error, L)}</ErrorBox>
      </main>
      <div className="sticky-bar">
        <button type="button" className={`btn ${saved ? '' : 'btn--henna'}`} disabled={busy || !name.trim()} onClick={save}>
          {saved && <CheckCircle size={26} weight="fill" />}<Say k={saved ? 'savedOk' : 'saveChanges'} />
        </button>
      </div>
      <AreaSheet open={picking} current={area} onClose={() => setPicking(false)} onPick={(a) => { setSaved(false); setArea(a); setPicking(false); }} />
    </>
  );
}

// A PIN keypad step: big boxes, number pad, sends when 4 numbers are in.
function PinPad({ titleK, error, busy, onDone }) {
  const [pin, setPin] = useState('');
  return (
    <>
      <Head icon={LockKey} title={<Say k={titleK} />} />
      <PinBoxes value={pin} masked />
      <ErrorBox>{error}</ErrorBox>
      <Keypad value={pin} disabled={busy} onChange={(v) => { setPin(v); if (v.length === 4) { onDone(v); setPin(''); } }} />
    </>
  );
}

// ---------- Change PIN ----------
export function MePin() {
  const L = useLang();
  const { t } = L;
  const navigate = useNavigate();
  const [step, setStep] = useState('current');
  const [current, setCurrent] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function finish(again) {
    if (again !== first) { setStep('new'); setError({ message: t('pinMismatch') }); return; }
    setBusy(true);
    setError(null);
    try {
      await api('/auth/pin/change', { method: 'POST', body: { pin: current, newPin: first } });
      setStep('done');
    } catch (err) {
      setError(err);
      setStep(err.code === 'pin_wrong' || err.code === 'pin_locked' ? 'current' : 'new');
    } finally { setBusy(false); }
  }
  const line = error && (error.code ? errorText(error, L) : error.message);

  return (
    <>
      <TopBar title={t('setPin')} back="/me" />
      <main className="page" style={{ paddingTop: 8 }}>
        {step === 'current' && <PinPad key="c" titleK="currentPin" error={line} busy={busy} onDone={(p) => { setCurrent(p); setError(null); setStep('new'); }} />}
        {step === 'new' && <PinPad key="n" titleK="newPin" error={line} busy={busy} onDone={(p) => { setFirst(p); setError(null); setStep('again'); }} />}
        {step === 'again' && <PinPad key="a" titleK="repeatPin" error={line} busy={busy} onDone={finish} />}
        {step === 'done' && (
          <div className="empty card pop-in">
            <Ico icon={CheckCircle} tone="leaf" size={44} box={84} />
            <h2 className="q"><Say k="pinChanged" className="center" /></h2>
            <button type="button" className="btn btn--henna" onClick={() => navigate('/me')}><Say k="done" /></button>
          </div>
        )}
      </main>
    </>
  );
}

// ---------- Change mobile number ----------
export function MePhone() {
  const L = useLang();
  const { t } = L;
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState('phone');
  const [rest, setRest] = useState('');
  const [channel, setChannel] = useState(null);
  const [demoCode, setDemoCode] = useState(null);
  const [code, setCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const phone = `0${rest}`;
  const run = async (fn) => { setBusy(true); setError(null); try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); } };

  const sendCode = (ch) => run(async () => {
    setChannel(ch);
    const res = await api('/auth/otp/request', { method: 'POST', body: { phone, channel: ch, purpose: 'change' } });
    setDemoCode(res.demoCode || null);
    setCode('');
    setStep('code');
  });
  const verify = (value) => run(async () => {
    try {
      const { ticket } = await api('/auth/otp/verify', { method: 'POST', body: { phone, code: value, purpose: 'change' } });
      const res = await api('/auth/phone/change', { method: 'POST', body: { ticket } });
      updateUser({ phone: res.phone });
      setNewPhone(res.phone);
      setStep('done');
    } catch (err) { setCode(''); throw err; }
  });
  const line = error && errorText(error, L);
  const back = { phone: '/me', channel: null, code: null, done: '/me' }[step];

  return (
    <>
      <header className="topbar" style={{ borderBottom: 0 }}>
        <button type="button" className="back-btn" aria-label={t('back')}
          onClick={() => (back ? navigate(back) : setStep(step === 'code' ? 'channel' : 'phone'))}>
          <CaretLeft size={26} weight="bold" />
        </button>
        <div className="titles"><h1>{t('setPhone')}</h1></div>
      </header>
      <main className="page" style={{ paddingTop: 4 }}>
        {step === 'phone' && (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); if (rest.length === 10) setStep('channel'); }}>
            <Head icon={DeviceMobile} title={<Say k="newNumberQ" />} sub={t('newNumberNote')} />
            <span className="phone-row">
              <span className="prefix">0</span>
              <input className="input" type="tel" inputMode="numeric" placeholder="300 1234567" autoFocus
                value={rest.replace(/^(\d{3})(\d)/, '$1 $2')}
                onChange={(e) => setRest(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10))} />
            </span>
            <button className="btn" type="submit" disabled={rest.length !== 10}><Say k="continue" /></button>
          </form>
        )}
        {step === 'channel' && <ChannelStep mode="signup" busy={busy} chosen={channel} onPick={sendCode} error={line} />}
        {step === 'code' && (
          <>
            <Head icon={Lock} title={<Say k="enterCode" />} sub={t(channel === 'whatsapp' ? 'codeSentWa' : 'codeSentSms', { phone: prettyPhone(phone) })} />
            {demoCode && <div className="demo-ribbon"><span>{t('demoCode')}</span><b>{demoCode}</b></div>}
            <PinBoxes value={code} />
            <ErrorBox>{line}</ErrorBox>
            <Keypad value={code} disabled={busy} onChange={(v) => { setCode(v); if (v.length === 4) verify(v); }} />
          </>
        )}
        {step === 'done' && (
          <div className="empty card pop-in">
            <Ico icon={CheckCircle} tone="leaf" size={44} box={84} />
            <h2 className="q"><Say k="numberChanged" vars={{ phone: prettyPhone(newPhone) }} className="center" /></h2>
            <button type="button" className="btn btn--henna" onClick={() => navigate('/me')}><Say k="done" /></button>
          </div>
        )}
      </main>
    </>
  );
}

// ---------- Close my account ----------
export function MeClose() {
  const L = useLang();
  const { t } = L;
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [step, setStep] = useState('explain');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function close(pin) {
    setBusy(true);
    setError(null);
    try {
      await api('/auth/close', { method: 'POST', body: { pin } });
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err);
      if (err.code === 'active_jobs' || err.code === 'open_dispute') setStep('explain');
    } finally { setBusy(false); }
  }
  const blocked = error && (error.code === 'active_jobs' || error.code === 'open_dispute');

  return (
    <>
      <TopBar title={t('setClose')} back="/me" />
      <main className="page">
        {step === 'explain' && (
          <>
            <Head icon={Warning} title={<Say k="closeTitle" />} />
            <section className="card stack">
              {[['closeWhat1', Lock], ['closeWhat2', X], ['closeWhat3', ClipboardText], ['closeWhat4', Phone]].map(([k, icon]) => (
                <div key={k} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <Ico icon={icon} tone="ink" size={20} box={34} />
                  <span style={{ fontWeight: 600 }}>{t(k)}</span>
                </div>
              ))}
            </section>
            {blocked && <ErrorBox>{errorText(error, L)}</ErrorBox>}
            {blocked && <Link to="/jobs" className="btn btn--ghost btn--small"><Say k="navJobs" /></Link>}
            <button type="button" className="btn" onClick={() => navigate('/me')}><Say k="keepAccount" /></button>
            <button type="button" className="btn btn--ghost-chilli btn--small" onClick={() => { setError(null); setStep('pin'); }}><Say k="yesClose" /></button>
          </>
        )}
        {step === 'pin' && <PinPad titleK="closeConfirmPin" error={error && errorText(error, L)} busy={busy} onDone={close} />}
      </main>
    </>
  );
}
