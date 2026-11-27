// Me → Close my account. Says plainly what happens, then asks for the PIN.
// Old jobs and ratings stay on the record (disputes are judged by it).
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, L, P, Btn, Card, row } from '../../ui/kit';
import { PinStep } from '../../ui/authSteps';
import { Ico } from '../../ui/motion';
import { Warning, Lock, X, ClipboardText, Phone } from '../../ui/icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/i18n';
import { C } from '../../ui/theme';

export default function CloseAccount() {
  const { t, u } = useLang();
  const { logout } = useAuth();
  const [step, setStep] = useState('explain');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = async (pin) => {
    setBusy(true); setError(null);
    try {
      await api('/auth/close', { method: 'POST', body: { pin } });
      await logout();
      router.replace('/welcome');
    } catch (err) {
      setError(err);
      if (err.code === 'active_jobs' || err.code === 'open_dispute') setStep('explain');
    } finally { setBusy(false); }
  };

  return (
    <Screen top={<TopBar title={t('setClose')} ur={u('setClose')} />}>
      {step === 'explain' && (
        <View style={{ gap: 16 }}>
          <View style={row.center}>
            <Ico icon={Warning} tone="chilli" size={30} box={54} motion="wiggle" play />
            <L k="closeTitle" size={22} weight="heavy" style={{ flex: 1 }} />
          </View>
          <Card>
            <View style={{ gap: 12 }}>
              {[['closeWhat1', Lock], ['closeWhat2', X], ['closeWhat3', ClipboardText], ['closeWhat4', Phone]].map(([k, icon]) => (
                <View key={k} style={[row.center, { alignItems: 'flex-start' }]}>
                  <Ico icon={icon} tone="ink" size={18} box={32} />
                  <P color={C.ink} style={{ flex: 1 }}>{t(k)}</P>
                </View>
              ))}
            </View>
          </Card>
          {error && (error.code === 'active_jobs' || error.code === 'open_dispute') && (
            <Card style={{ backgroundColor: C.chilliTint, borderColor: C.chilliTint }}>
              <P weight="bold" color={C.chilliDeep}>{t(`err_${error.code}`)}</P>
            </Card>
          )}
          <Btn kind="leaf" k="keepAccount" onPress={() => router.back()} />
          <Btn kind="ghostChilli" k="yesClose" small onPress={() => { setError(null); setStep('pin'); }} />
        </View>
      )}
      {step === 'pin' && <PinStep titleK="closeConfirmPin" onComplete={close} error={error} busy={busy} />}
    </Screen>
  );
}
