// Log in: mobile number -> 4-number PIN. Forgot PIN: code -> new PIN.
// The app checks the number first, so it can say "No account with this number"
// (and offer sign up) or "This is a customer number" instead of a confusing error.
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, TopBar, L, Btn } from '../ui/kit';
import { PhoneStep, ChannelStep, CodeStep, PinStep, MismatchPanel } from '../ui/authSteps';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/i18n';
import { C } from '../ui/theme';

export default function Login() {
  const params = useLocalSearchParams();
  const { t, u } = useLang();
  const { signIn } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(params.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState(null);
  const [sent, setSent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [newPin, setNewPin] = useState(null);

  const go = (s) => { setError(null); setStep(s); };
  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); }
  };

  const checkPhone = () => run(async () => {
    try {
      const res = await api('/auth/phone', { method: 'POST', body: { phone, app: 'worker' } });
      setPhone(res.phone);
      go(res.registered ? 'pin' : 'noAccount');
    } catch (err) {
      if (err.code === 'wrong_app') go('wrongApp');
      else throw err;
    }
  });

  const login = (pin) => run(async () => {
    const res = await api('/auth/login', { method: 'POST', body: { phone, pin, app: 'worker' } });
    await signIn(res);
    router.replace('/home');
  });

  const sendCode = (ch) => run(async () => {
    setChannel(ch);
    const res = await api('/auth/otp/request', { method: 'POST', body: { phone, channel: ch, purpose: 'reset', app: 'worker' } });
    setSent(res);
    go('code');
  });

  const verify = (code) => run(async () => {
    const res = await api('/auth/otp/verify', { method: 'POST', body: { phone, code, purpose: 'reset' } });
    setTicket(res.ticket);
    go('newpin');
  });

  const reset = (pin) => run(async () => {
    if (pin !== newPin) { setNewPin(null); setStep('newpin'); setError(t('pinMismatch')); return; }
    const res = await api('/auth/pin/reset', { method: 'POST', body: { ticket, pin, app: 'worker' } });
    await signIn(res);
    router.replace('/home');
  });

  const back = {
    phone: null, pin: 'phone', noAccount: 'phone', wrongApp: 'phone', channel: 'pin', code: 'channel', newpin: 'channel', confirm: 'newpin',
  }[step];

  return (
    <Screen top={<TopBar title={t('loginTitle')} ur={u('loginTitle')} onBack={back ? () => go(back) : undefined} />}>
      {step === 'phone' && <PhoneStep titleK="doorHave" phone={phone} setPhone={setPhone} onNext={checkPhone} busy={busy} error={error} />}

      {step === 'pin' && <L k="welcomeBack" size={20} weight="heavy" color={C.leafDeep} />}
      {step === 'pin' && (
        <PinStep titleK="enterPin" onComplete={login} error={error} busy={busy}>
          <Btn k="forgotPin" kind="ghost" small onPress={() => go('channel')} />
          <Btn k="changeNumber" kind="ghost" small onPress={() => go('phone')} />
        </PinStep>
      )}

      {step === 'noAccount' && (
        <MismatchPanel kind="noAccount" phone={phone} onPrimary={() => router.replace({ pathname: '/signup', params: { phone } })} onOther={() => { setPhone(''); go('phone'); }} />
      )}
      {step === 'wrongApp' && <MismatchPanel kind="wrongApp" phone={phone} onOther={() => { setPhone(''); go('phone'); }} />}

      {step === 'channel' && <ChannelStep noteK="resetNote" onPick={sendCode} busy={busy} chosen={channel} error={error} />}
      {step === 'code' && (
        <CodeStep phone={phone} sent={sent} onCode={verify} onResend={() => sendCode(channel)} onOtherWay={() => go('channel')} error={error} busy={busy} />
      )}
      {step === 'newpin' && <PinStep titleK="newPin" noteK="makePinNote" onComplete={(p) => { setNewPin(p); go('confirm'); }} error={error} busy={busy} />}
      {step === 'confirm' && <PinStep titleK="repeatPin" onComplete={reset} error={error} busy={busy} resetKey="confirm" />}
    </Screen>
  );
}
