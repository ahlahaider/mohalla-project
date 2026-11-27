// Me → My work: services, areas and starting price. These decide which requests
// and which "Jobs near you" a worker gets, so adding areas = more work.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, Say, P, Btn, Chip, Field, Input, ErrorBox, Box, row } from '../../ui/kit';
import { CATEGORIES, CheckCircle, MapPin } from '../../ui/icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useLang, AREA_KEYS } from '../../lib/i18n';
import { C } from '../../ui/theme';

export default function WorkSettings() {
  const { t, u, cat, catU, areaName, areaU } = useLang();
  const { user, setUser } = useAuth();
  const p = user?.workerProfile || {};
  const [skills, setSkills] = useState(p.skills || []);
  const [areas, setAreas] = useState(p.areasServed || []);
  const [price, setPrice] = useState(p.priceMin ? String(p.priceMin) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  if (!user) return null;
  const toggle = (list, set, key) => { setSaved(false); set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]); };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api('/workers/me', { method: 'PATCH', body: { skills, areasServed: areas, priceMin: price ? Number(price) : null } });
      setUser({ ...user, ...res.user });
      setSaved(true);
      setTimeout(() => router.back(), 600);
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Screen
      top={<TopBar title={t('setWork')} ur={u('setWork')} />}
      bottom={<Btn kind={saved ? 'leaf' : 'henna'} k={saved ? 'savedOk' : 'saveChanges'} icon={saved ? CheckCircle : undefined} busy={busy} disabled={!skills.length || !areas.length} onPress={save} />}
    >
      <Box tone="leaf">
        <View style={row.center}>
          <MapPin size={22} weight="fill" color={C.leafDeep} />
          <P weight="bold" color={C.leafDeep} style={{ flex: 1 }}>{t('setWorkHint')}</P>
        </View>
      </Box>
      <ErrorBox error={error} />
      <Field label={t('myWork')} ur={u('myWork')} hint={t('workNote')}>
        <View style={row.wrap}>
          {CATEGORIES.map((c) => <Chip key={c.key} icon={c.icon} tone={c.key} motion={c.motion} main={cat(c.key)} ur={catU(c.key)} selected={skills.includes(c.key)} onPress={() => toggle(skills, setSkills, c.key)} />)}
        </View>
      </Field>
      <Field label={t('myAreas')} ur={u('myAreas')} hint={t('areasNote')}>
        <View style={row.wrap}>
          {AREA_KEYS.map((a) => <Chip key={a} main={areaName(a)} ur={areaU(a)} selected={areas.includes(a)} onPress={() => toggle(areas, setAreas, a)} />)}
        </View>
      </Field>
      <Field label={t('startingPrice')} ur={u('startingPrice')} hint={t('priceNote')}>
        <View style={row.center}>
          <Say main="Rs" size={20} weight="heavy" color={C.ink3} />
          <Input value={price} onChangeText={(v) => { setSaved(false); setPrice(v.replace(/\D/g, '').slice(0, 6)); }} keyboardType="number-pad" inputMode="numeric" style={{ flex: 1 }} />
        </View>
      </Field>
    </Screen>
  );
}
