// Me → Change mobile number: new number → code sent to the NEW number → done.
// The PIN stays the same; old jobs stay on the account.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, L, P, Btn, PhoneInput, ErrorBox } from '../../ui/kit';
import { ChannelStep, CodeStep } from '../../ui/authSteps';
import { Ico } from '../../ui/motion';
import { CheckCircle } from '../../ui/icons';
import { api, prettyPhone } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/i18n';
import { C } from '../../ui/theme';

export default function ChangePhone() {
  const { t, u } = useLang();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState(null);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn) => { setBusy(true); setError(null); try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); } };

  const sendCode = (ch) => run(async () => {
    setChannel(ch);
    const res = await api('/auth/otp/request', { method: 'POST', body: { phone, channel: ch, purpose: 'change' } });
    setSent(res);
    setStep('code');
  });
  const verify = (code) => run(async () => {
    const { ticket } = await api('/auth/otp/verify', { method: 'POST', body: { phone, code, purpose: 'change' } });
    const res = await api('/auth/phone/change', { method: 'POST', body: { ticket } });
    setUser({ ...user, phone: res.phone });
    setStep('done');
  });

  const back = { phone: undefined, channel: () => setStep('phone'), code: () => setStep('channel'), done: undefined }[step];

  return (
    <Screen top={<TopBar title={t('setPhone')} ur={u('setPhone')} onBack={back} />}>
      {step === 'phone' && (
        <View style={{ gap: 14 }}>
          <L k="newNumberQ" size={22} weight="heavy" />
          <P>{t('newNumberNote')}</P>
          <PhoneInput value={phone} onChange={setPhone} autoFocus onSubmit={() => setStep('channel')} />
          <ErrorBox error={error} />
          <Btn kind="henna" k="continue" disabled={phone.replace(/\D/g, '').length < 10} onPress={() => { setError(null); setStep('channel'); }} />
          <P size={14} color={C.ink3}>{prettyPhone(user?.phone)}</P>
        </View>
      )}
      {step === 'channel' && <ChannelStep onPick={sendCode} busy={busy} chosen={channel} error={error} />}
      {step === 'code' && <CodeStep phone={phone} sent={sent} onCode={verify} onResend={() => sendCode(channel)} onOtherWay={() => setStep('channel')} error={error} busy={busy} />}
      {step === 'done' && (
        <View style={{ alignItems: 'center', gap: 16, paddingTop: 30 }}>
          <Ico icon={CheckCircle} tone="leaf" size={56} box={110} motion="pop" play round />
          <L k="numberChanged" vars={{ phone: prettyPhone(user?.phone) }} size={20} weight="heavy" align="center" />
          <Btn kind="henna" k="done" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </View>
      )}
    </Screen>
  );
}
