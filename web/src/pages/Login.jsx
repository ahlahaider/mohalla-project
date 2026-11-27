// Screen 4 · Log in or sign up, only when needed (asking a worker to come, or My jobs).
//
// First the person picks one of two big doors: "Log in" or "Sign up".
//   Log in:      mobile number -> PIN
//   Sign up:     mobile number -> SMS or WhatsApp? -> code -> name -> PIN (twice)
//   Forgot PIN:  SMS or WhatsApp? -> code -> new PIN (twice)
// If they pick the wrong door (signing up with a number that already has an
// account, or logging in with a new number), the app says so and offers the right one.
//
// When it's done we go back to `returnTo`, the page the person was trying to reach.
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CaretLeft, DeviceMobile, LockKey, ChatCircleDots, WhatsappLogo, ChatText, UserCircle, Password, Lock,
  ArrowRight, ArrowClockwise, Flask, Key, UserPlus, Info, CaretRight,
} from '@phosphor-icons/react';
import { api, errorText, prettyPhone } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { useArea, safeReturnTo } from '../prefs.js';
import { Ico, Say, Keypad, PinBoxes, ErrorBox } from '../ui/kit.jsx';

const PIN_LENGTH = 4;
const CODE_LENGTH = 4;

export default function Login() {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'), '/jobs');
  const forName = params.get('for');
  const navigate = useNavigate();
  const auth = useAuth();
  const L = useLang();
  const { t, lang } = L;
  const [area] = useArea();

  const [step, setStep] = useState('start'); // start | phone | pin | channel | code | name | newpin | confirmpin
  const [intent, setIntent] = useState(null); // the door they picked: 'login' | 'signup'
  const [mismatch, setMismatch] = useState(null); // 'hasAccount' | 'noAccount' (picked the wrong door) | 'wrongApp' (a worker's number)
  const [mode, setMode] = useState('signup'); // signup | reset (which code we ask for)
  const [rest, setRest] = useState('');       // the number after the leading 0, e.g. "3001234567"
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [code, setCode] = useState('');
  const [channel, setChannel] = useState(null);
  const [demoCode, setDemoCode] = useState(null);
  const [resendAt, setResendAt] = useState(0);
  const [ticket, setTicket] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const phone = `0${rest}`;
  const phoneOk = /^3\d{9}$/.test(rest);

  const fail = (err) => {
    setError(err);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  // Run an API step: shows a spinner state and catches errors in one place.
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const finished = (user) => navigate(user.role === 'admin' ? '/admin' : returnTo, { replace: true });

  // ---- step actions ----
  const submitPhone = () => run(async () => {
    let registered;
    try {
      ({ registered } = await api('/auth/phone', { method: 'POST', body: { phone, app: 'customer' } }));
    } catch (err) {
      if (err.code === 'wrong_app') { setMismatch('wrongApp'); return; } // a worker's number: point them to their app
      throw err;
    }
    if (intent === 'login' && registered) setStep('pin');
    else if (intent === 'signup' && !registered) { setMode('signup'); setStep('channel'); }
    else setMismatch(registered ? 'hasAccount' : 'noAccount'); // wrong door: say so, offer the right one
  });

  const choose = (door) => { setIntent(door); setMismatch(null); setError(null); setStep('phone'); };
  const goLoginInstead = () => { setIntent('login'); setMismatch(null); setPin(''); setStep('pin'); };
  const goSignupInstead = () => { setIntent('signup'); setMismatch(null); setMode('signup'); setStep('channel'); };

  const submitPin = (value) => run(async () => {
    try {
      finished(await auth.loginWithPin(phone, value));
    } catch (err) {
      setPin('');
      throw err;
    }
  });

  const requestCode = (ch) => run(async () => {
    setChannel(ch);
    try {
      const res = await api('/auth/otp/request', { method: 'POST', body: { phone, channel: ch, purpose: mode, app: 'customer' } });
      setDemoCode(res.demoCode || null);
      setResendAt(Date.now() + res.resendSeconds * 1000);
      setCode('');
      setStep('code');
    } catch (err) {
      if (err.code === 'already_registered') setStep('pin');
      throw err;
    }
  });

  const submitCode = (value) => run(async () => {
    try {
      const res = await api('/auth/otp/verify', { method: 'POST', body: { phone, purpose: mode, code: value } });
      setTicket(res.ticket);
      setStep(mode === 'signup' ? 'name' : 'newpin');
    } catch (err) {
      setCode('');
      throw err;
    }
  });

  const submitNewPin = (value) => {
    setFirstPin(value);
    setPin('');
    setStep('confirmpin');
  };

  const submitConfirmPin = (value) => {
    if (value !== firstPin) {
      setPin('');
      setFirstPin('');
      setStep('newpin');
      fail({ message: t('pinMismatch') });
      return;
    }
    run(async () => {
      try {
        const user = mode === 'signup'
          ? await auth.register({ ticket, name: name.trim(), pin: value, area, language: lang })
          : await auth.resetPin({ ticket, pin: value });
        finished(user);
      } catch (err) {
        setPin('');
        if (err.code === 'otp_expired') setStep('channel'); // took too long: get a fresh code
        else setStep('newpin');
        throw err;
      }
    });
  };

  // Keypads submit by themselves once all 4 numbers are in.
  const onPinKeys = (value) => {
    setPin(value);
    setError(null);
    if (value.length !== PIN_LENGTH) return;
    if (step === 'pin') submitPin(value);
    if (step === 'newpin') submitNewPin(value);
    if (step === 'confirmpin') submitConfirmPin(value);
  };
  const onCodeKeys = (value) => {
    setCode(value);
    setError(null);
    if (value.length === CODE_LENGTH) submitCode(value);
  };

  const startReset = () => { setMode('reset'); setError(null); setStep('channel'); };

  // Where the round back button goes from each step.
  const backFrom = {
    start: () => navigate(-1),
    phone: () => { setMismatch(null); setStep('start'); },
    pin: () => setStep('phone'),
    channel: () => setStep(mode === 'reset' ? 'pin' : 'phone'),
    code: () => setStep('channel'),
    name: () => setStep('channel'),
    newpin: () => setStep(mode === 'signup' ? 'name' : 'channel'),
    confirmpin: () => { setPin(''); setStep('newpin'); },
  };
  const goBack = () => { setError(null); setPin(''); setCode(''); backFrom[step](); };

  const errorLine = error && (error.code ? errorText(error, L) : error.message);

  // "Step 1 of 3" on the sign-up screens (number + code = 1, name = 2, PIN = 3).
  const signupStep = mode === 'signup' && intent === 'signup'
    ? { phone: 1, channel: 1, code: 1, name: 2, newpin: 3, confirmpin: 3 }[step]
    : null;

  return (
    <>
      <header className="topbar" style={{ borderBottom: 0 }}>
        <button type="button" className="back-btn" onClick={goBack} aria-label={t('back')}>
          <CaretLeft size={26} weight="bold" />
        </button>
        {signupStep && <span className="tag soft" style={{ marginLeft: 'auto' }}>{t('stepOf', { n: signupStep })}</span>}
      </header>

      <main className="page" style={{ paddingTop: 4 }}>
        {step === 'start' && (
          <>
            <Head icon={DeviceMobile}
              title={forName ? <Say k="loginFor" vars={{ name: forName }} /> : <Say k="loginJobs" />}
              sub={t('phoneOnly')} />
            <div className="stack">
              <button type="button" className="door moves" onClick={() => choose('login')}>
                <Ico icon={Key} tone="leaf" size={32} box={60} motion="wiggle" />
                <span className="door-text">
                  <Say k="startLogin" className="door-title" />
                  <span className="door-hint">{t('startLoginHint')}</span>
                </span>
                <CaretRight size={26} weight="bold" />
              </button>
              <button type="button" className="door moves" onClick={() => choose('signup')}>
                <Ico icon={UserPlus} tone="saffron" size={32} box={60} motion="wiggle" />
                <span className="door-text">
                  <Say k="startSignup" className="door-title" />
                  <span className="door-hint">{t('startSignupHint')}</span>
                </span>
                <CaretRight size={26} weight="bold" />
              </button>
            </div>
            <div className="box leaf note">
              <Ico icon={Lock} tone="leaf" size={22} />
              <span>{t('privacyNote')}</span>
            </div>
          </>
        )}

        {step === 'phone' && (
          <>
            <Head icon={intent === 'login' ? Key : UserPlus}
              title={<Say k={intent === 'login' ? 'loginTitle' : 'signupTitle'} />}
              sub={t('phoneOnly')} />
            <form onSubmit={(e) => { e.preventDefault(); if (phoneOk) submitPhone(); }} className="stack">
              <label className="field">
                <span className="field-label"><span>{t('mobileNumber')}</span><span className="ur" dir="rtl">{L.u('mobileNumber')}</span></span>
                <span className="phone-row">
                  <span className="prefix">0</span>
                  <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="300 1234567"
                    value={rest.replace(/^(\d{3})(\d)/, '$1 $2')}
                    onChange={(e) => { setMismatch(null); setRest(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10)); }}
                    autoFocus
                  />
                </span>
              </label>
              <ErrorBox>{errorLine}</ErrorBox>
              {!mismatch && (
                <button className="btn" type="submit" disabled={!phoneOk || busy}>
                  <Say k="continue" /> <ArrowRight size={24} weight="bold" />
                </button>
              )}
            </form>

            {mismatch && (
              <div className="card stack pop-in" role="alert">
                <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <Ico icon={Info} tone={mismatch === 'wrongApp' ? 'chilli' : 'saffron'} size={24} />
                  <div>
                    <Say k={mismatch === 'wrongApp' ? 'wrongAppTitle' : mismatch} className="door-title" />
                    <div className="muted" style={{ fontWeight: 600 }}>{t({ hasAccount: 'hasAccountHint', noAccount: 'noAccountHint', wrongApp: 'wrongAppHint' }[mismatch])}</div>
                  </div>
                </div>
                {mismatch === 'hasAccount' && <button type="button" className="btn" onClick={goLoginInstead}><Key size={24} weight="duotone" /><Say k="loginInstead" /></button>}
                {mismatch === 'noAccount' && <button type="button" className="btn btn--saffron" onClick={goSignupInstead}><UserPlus size={24} weight="duotone" /><Say k="signupWithThis" /></button>}
                <button type="button" className="link-btn" style={{ alignSelf: 'center' }}
                  onClick={() => { setMismatch(null); setRest(''); }}>{t('orTryAnother')}</button>
              </div>
            )}
          </>
        )}

        {step === 'pin' && (
          <>
            <Head icon={LockKey} title={<Say k="enterPin" />} sub={<>{t('welcomeBack')} <b>{prettyPhone(phone)}</b></>} />
            <PinBoxes value={pin} masked shake={shake} />
            <ErrorBox>{errorLine}</ErrorBox>
            <Keypad value={pin} onChange={onPinKeys} disabled={busy} />
            <div className="row spread">
              <button type="button" className="link-btn" onClick={startReset}><Say k="forgotPin" /></button>
              <button type="button" className="link-btn" onClick={() => { setPin(''); setStep('phone'); }}>{t('changeNumber')}</button>
            </div>
          </>
        )}

        {step === 'channel' && <ChannelStep mode={mode} busy={busy} chosen={channel} onPick={requestCode} error={errorLine} />}

        {step === 'code' && (
          <>
            <Head icon={ChatCircleDots}
              title={<Say k="enterCode" />}
              sub={t(channel === 'whatsapp' ? 'codeSentWa' : 'codeSentSms', { phone: prettyPhone(phone) })} />
            {demoCode && (
              <div className="demo-ribbon">
                <Ico icon={Flask} tone="saffron" size={24} />
                <span>{t('demoCode')} <b>{demoCode}</b></span>
              </div>
            )}
            <PinBoxes value={code} length={CODE_LENGTH} shake={shake} />
            <ErrorBox>{errorLine}</ErrorBox>
            <Keypad value={code} onChange={onCodeKeys} length={CODE_LENGTH} disabled={busy} />
            <div className="row spread" style={{ flexWrap: 'wrap' }}>
              <ResendButton resendAt={resendAt} onResend={() => requestCode(channel)} />
              <button type="button" className="link-btn" onClick={() => { setError(null); setStep('channel'); }}>{t('otherWay')}</button>
            </div>
          </>
        )}

        {step === 'name' && (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { setPin(''); setStep('newpin'); } }}>
            <Head icon={UserCircle} title={<Say k="yourName" />} sub={t('nameNote')} />
            <input className="input" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} autoComplete="name" autoFocus />
            <button className="btn" type="submit" disabled={!name.trim()}>
              <Say k="continue" /> <ArrowRight size={24} weight="bold" />
            </button>
          </form>
        )}

        {(step === 'newpin' || step === 'confirmpin') && (
          <>
            <Head icon={Password}
              title={<Say k={step === 'confirmpin' ? 'repeatPin' : mode === 'reset' ? 'newPin' : 'makePin'} />}
              sub={t('makePinNote')} />
            <PinBoxes value={pin} masked shake={shake} />
            <ErrorBox>{errorLine}</ErrorBox>
            <Keypad value={pin} onChange={onPinKeys} disabled={busy} />
          </>
        )}
      </main>
    </>
  );
}

function Head({ icon, title, sub }) {
  return (
    <div className="stack">
      <Ico icon={icon} tone="henna" size={34} box={64} className="pop-in" />
      <h1 className="title">{title}</h1>
      {sub && <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{sub}</p>}
    </div>
  );
}

// "Where should we send your code?" asked in English AND Roman Urdu (and Urdu),
// whichever language is chosen, because this is where people get stuck.
function ChannelStep({ mode, busy, chosen, onPick, error }) {
  const { all, t } = useLang();
  const [en, roman, ur] = all('channelQ');
  return (
    <>
      <div className="stack">
        <Ico icon={ChatCircleDots} tone="henna" size={34} box={64} className="pop-in" />
        <h1 className="title">
          {en}
          <span style={{ display: 'block', fontSize: 22, color: 'var(--ink-2)', marginTop: 2 }}>{roman}</span>
          <span className="ur" dir="rtl" lang="ur">{ur}</span>
        </h1>
        <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{t(mode === 'reset' ? 'resetNote' : 'channelNote')}</p>
      </div>
      <div className="choice-grid">
        <button type="button" className="choice moves" disabled={busy} aria-pressed={busy && chosen === 'whatsapp'} onClick={() => onPick('whatsapp')}>
          <span className="ico mo-ring" style={{ '--s': '64px', background: 'var(--wa)', borderRadius: '50%' }} aria-hidden="true">
            <WhatsappLogo size={38} weight="fill" color="#fff" />
          </span>
          <Say k="viaWhatsapp" className="center" />
          <span className="hint">{t('viaWhatsappHint')}</span>
        </button>
        <button type="button" className="choice moves" disabled={busy} aria-pressed={busy && chosen === 'sms'} onClick={() => onPick('sms')}>
          <Ico icon={ChatText} tone="saffron" size={38} box={64} motion="wiggle" />
          <Say k="viaSms" className="center" />
          <span className="hint">{t('viaSmsHint')}</span>
        </button>
      </div>
      <ErrorBox>{error}</ErrorBox>
    </>
  );
}

// "Send again" waits 30 seconds (the API refuses sooner), showing the countdown.
function ResendButton({ resendAt, onResend }) {
  const { t } = useLang();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.ceil((resendAt - now) / 1000);
  return (
    <button type="button" className="link-btn" disabled={left > 0} onClick={onResend} style={left > 0 ? { color: 'var(--ink-3)', textDecoration: 'none' } : undefined}>
      <ArrowClockwise size={20} weight="bold" />
      {left > 0 ? t('sendAgainIn', { n: `0:${String(left).padStart(2, '0')}` }) : t('sendAgain')}
    </button>
  );
}
