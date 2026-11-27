// My profile: photo, name, work, areas, starting price, man/woman, and log out.
// Opened by tapping your photo on the home screen.
import { useState } from 'react';
import { View, Image } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, Say, P, Btn, Chip, Choice, Field, Input, Avatar, ErrorBox, Box, row } from '../ui/kit';
import { Camera, Images, SignOut, CheckCircle, GenderMale, GenderFemale, Storefront } from '../ui/icons';
import { CATEGORIES } from '../ui/icons';
import { api, prettyPhone } from '../lib/api';
import { pickPhoto, uploadPhoto } from '../lib/photos';
import { useAuth } from '../lib/auth';
import { useLang, AREA_KEYS } from '../lib/i18n';
import { C } from '../ui/theme';

export default function Profile() {
  const { t, u, cat, catU, areaName, areaU } = useLang();
  const { user, setUser, logout } = useAuth();
  const p = user?.workerProfile || {};
  const [name, setName] = useState(user?.name || '');
  const [skills, setSkills] = useState(p.skills || []);
  const [areas, setAreas] = useState(p.areasServed || []);
  const [price, setPrice] = useState(p.priceMin ? String(p.priceMin) : '');
  const [gender, setGender] = useState(p.gender);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  const toggle = (list, set, key) => { setSaved(false); set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]); };

  const changePhoto = async (from) => {
    setError(null);
    try {
      const picked = await pickPhoto(from);
      if (!picked) return;
      setPhotoBusy(true);
      const url = await uploadPhoto(picked);
      await api('/workers/me', { method: 'PATCH', body: { photoUrl: url } });
      setUser({ ...user, photoUrl: url });
    } catch (err) { setError(err); } finally { setPhotoBusy(false); }
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api('/workers/me', {
        method: 'PATCH',
        body: { name: name.trim(), skills, areasServed: areas, priceMin: price ? Number(price) : null, gender: gender || 'unspecified' },
      });
      setUser({ ...user, ...res.user });
      setSaved(true);
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Screen
      top={<TopBar title={t('profileTitle')} ur={u('profileTitle')} />}
      bottom={<Btn kind={saved ? 'leaf' : 'henna'} k={saved ? 'savedOk' : 'saveChanges'} icon={saved ? CheckCircle : undefined} busy={busy} disabled={!name.trim() || !skills.length || !areas.length} onPress={save} />}
    >
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Avatar name={user.name} photoUrl={user.photoUrl} size={110} tone="#f7d9a8" />
        <P weight="bold">{prettyPhone(user.phone)}</P>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Btn kind="ghost" k={user.photoUrl ? 'retake' : 'takePhoto'} icon={Camera} small busy={photoBusy} onPress={() => changePhoto('camera')} style={{ flex: 1 }} />
          <Btn kind="ghost" k="choosePhoto" icon={Images} small disabled={photoBusy} onPress={() => changePhoto('gallery')} style={{ flex: 1 }} />
        </View>
      </View>

      {user.assistedBy?.name && (
        <Box tone="plain"><View style={row.center}><Storefront size={20} color={C.ink2} /><P>{t('helpedBy', { name: user.assistedBy.name })}</P></View></Box>
      )}

      <ErrorBox error={error} />

      <Field label={t('nameQ')} ur={u('nameQ')}>
        <Input value={name} onChangeText={(v) => { setSaved(false); setName(v); }} maxLength={60} />
      </Field>

      <Field label={t('myWork')} ur={u('myWork')}>
        <View style={row.wrap}>
          {CATEGORIES.map((c) => <Chip key={c.key} icon={c.icon} tone={c.key} motion={c.motion} main={cat(c.key)} ur={catU(c.key)} selected={skills.includes(c.key)} onPress={() => toggle(skills, setSkills, c.key)} />)}
        </View>
      </Field>

      <Field label={t('myAreas')} ur={u('myAreas')}>
        <View style={row.wrap}>
          {AREA_KEYS.map((a) => <Chip key={a} main={areaName(a)} ur={areaU(a)} selected={areas.includes(a)} onPress={() => toggle(areas, setAreas, a)} />)}
        </View>
      </Field>

      <Field label={t('startingPrice')} ur={u('startingPrice')}>
        <View style={row.center}>
          <Say main="Rs" size={20} weight="heavy" color={C.ink3} />
          <Input value={price} onChangeText={(v) => { setSaved(false); setPrice(v.replace(/\D/g, '').slice(0, 6)); }} keyboardType="number-pad" inputMode="numeric" style={{ flex: 1 }} />
        </View>
      </Field>

      <Field label={t('genderQ')} ur={u('genderQ')}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Choice icon={GenderMale} tone="plumber" main={t('man')} ur={u('man')} selected={gender === 'male'} onPress={() => { setSaved(false); setGender('male'); }} />
          <Choice icon={GenderFemale} tone="painter" main={t('woman')} ur={u('woman')} selected={gender === 'female'} onPress={() => { setSaved(false); setGender('female'); }} />
        </View>
      </Field>

      <Btn kind="ghostChilli" k="logout" icon={SignOut} small onPress={async () => { await logout(); router.replace('/welcome'); }} />
    </Screen>
  );
}
