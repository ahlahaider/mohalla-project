// Me → Change PIN: current PIN, then the new PIN twice.
// (Forgot the current one? Log out and use "Forgot PIN?" on the log-in screen.)
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, L, Btn } from '../../ui/kit';
import { PinStep } from '../../ui/authSteps';
import { Ico } from '../../ui/motion';
import { CheckCircle } from '../../ui/icons';
import { api } from '../../lib/api';
import { useLang } from '../../lib/i18n';

export default function ChangePin() {
  const { t, u } = useLang();
  const [step, setStep] = useState('current');
  const [current, setCurrent] = useState(null);
  const [first, setFirst] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const finish = async (again) => {
    if (again !== first) { setFirst(null); setStep('new'); setError(t('pinMismatch')); return; }
    setBusy(true); setError(null);
    try {
      await api('/auth/pin/change', { method: 'POST', body: { pin: current, newPin: first } });
      setStep('done');
    } catch (err) {
      setError(err);
      setStep(err.code === 'pin_wrong' || err.code === 'pin_locked' ? 'current' : 'new');
    } finally { setBusy(false); }
  };

  return (
    <Screen top={<TopBar title={t('setPin')} ur={u('setPin')} />}>
      {step === 'current' && <PinStep titleK="currentPin" onComplete={(p) => { setCurrent(p); setError(null); setStep('new'); }} error={error} busy={busy} />}
      {step === 'new' && <PinStep titleK="newPin" noteK="makePinNote" onComplete={(p) => { setFirst(p); setError(null); setStep('again'); }} error={error} busy={busy} resetKey="new" />}
      {step === 'again' && <PinStep titleK="repeatPin" onComplete={finish} error={error} busy={busy} resetKey="again" />}
      {step === 'done' && (
        <View style={{ alignItems: 'center', gap: 16, paddingTop: 30 }}>
          <Ico icon={CheckCircle} tone="leaf" size={56} box={110} motion="pop" play round />
          <L k="pinChanged" size={22} weight="heavy" align="center" />
          <Btn kind="henna" k="done" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </View>
      )}
    </Screen>
  );
}
