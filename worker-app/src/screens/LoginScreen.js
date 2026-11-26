import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { api } from '../api';
import { Btn, Card, ErrorText, Field, H, Muted, s, C, T } from '../ui';

export default function LoginScreen({ i18n, onDone, goRegister }) {
  const { t, toggleLang, lang } = i18n;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await onDone(await api('/auth/login', { method: 'POST', body: { phone, password } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 24 }]}>
        <T style={{ fontSize: 34, fontWeight: '800', color: C.terracotta }}>mohalla</T>
        <Btn title={lang === 'en' ? 'Roman Urdu' : 'English'} onPress={toggleLang} />
      </View>
      <Card>
        <H>{t('login')}</H>
        <Field label={`📱 ${t('phone')}`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0300 1234567" />
        <Field label={`🔒 ${t('password')}`} value={password} onChangeText={setPassword} secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <Btn kind="primary" title={t('login')} icon="➜" onPress={submit} disabled={busy} />
      </Card>
      <Btn title={t('signup')} onPress={goRegister} />
      <Muted style={{ marginTop: 16, textAlign: 'center' }}>Demo: 03111111111 / password123</Muted>
    </ScrollView>
  );
}
