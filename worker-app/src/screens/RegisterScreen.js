// Worker sign-up: services and areas are picked by tapping icons/chips
// rather than typing, to keep it usable for people who don't read well.
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { api } from '../api';
import { Btn, Card, Chip, ErrorText, Field, H, s, T } from '../ui';

export default function RegisterScreen({ i18n, onDone, goLogin }) {
  const { t, cat, catIcon, areaName, lang } = i18n;
  const [meta, setMeta] = useState({ categories: [], areas: [] });
  const [form, setForm] = useState({ name: '', phone: '', password: '', priceMin: '', priceMax: '', gender: 'unspecified' });
  const [skills, setSkills] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { api('/meta').then(setMeta).catch((e) => setError(e.message)); }, []);

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const set = (k) => (v) => setForm({ ...form, [k]: v });

  async function submit() {
    setError('');
    if (!skills.length || !areas.length) return setError(`${t('skills')} / ${t('areas')}`);
    try {
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          role: 'worker', name: form.name, phone: form.phone, password: form.password, area: areas[0], language: lang,
          workerProfile: {
            skills, areasServed: areas, gender: form.gender,
            priceMin: Number(form.priceMin) || undefined, priceMax: Number(form.priceMax) || undefined,
          },
        },
      });
      await onDone(res);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <H>{t('createAccount')}</H>
      <Card>
        <Field label={`👤 ${t('name')}`} value={form.name} onChangeText={set('name')} />
        <Field label={`📱 ${t('phone')}`} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="0300 1234567" />
        <Field label={`🔒 ${t('password')}`} value={form.password} onChangeText={set('password')} secureTextEntry />
      </Card>

      <Card>
        <T style={s.label}>🛠️ {t('skills')}</T>
        <View style={s.row}>
          {meta.categories.map((c) => (
            <Chip key={c} label={`${catIcon(c)} ${cat(c)}`} on={skills.includes(c)} onPress={() => toggle(skills, setSkills, c)} />
          ))}
        </View>
      </Card>

      <Card>
        <T style={s.label}>📍 {t('areas')}</T>
        <View style={s.row}>
          {meta.areas.map((a) => <Chip key={a} label={areaName(a)} on={areas.includes(a)} onPress={() => toggle(areas, setAreas, a)} />)}
        </View>
      </Card>

      <Card>
        <View style={[s.row, { flexWrap: 'nowrap' }]}>
          <View style={{ flex: 1 }}><Field label={t('priceFrom')} value={form.priceMin} onChangeText={set('priceMin')} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t('priceTo')} value={form.priceMax} onChangeText={set('priceMax')} keyboardType="number-pad" /></View>
        </View>
        <T style={s.label}>{t('gender')}</T>
        <View style={s.row}>
          <Chip label={t('female')} on={form.gender === 'female'} onPress={() => set('gender')('female')} />
          <Chip label={t('male')} on={form.gender === 'male'} onPress={() => set('gender')('male')} />
        </View>
      </Card>

      <ErrorText>{error}</ErrorText>
      <Btn kind="primary" icon="✓" title={t('createAccount')} onPress={submit} />
      <View style={{ height: 12 }} />
      <Btn title={t('haveAccount')} onPress={goLogin} />
    </ScrollView>
  );
}
