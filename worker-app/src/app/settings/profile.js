// Me → My profile: photo, name, about me, man/woman.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, P, Btn, Choice, Field, Input, Avatar, ErrorBox, Box, row } from '../../ui/kit';
import { Camera, Images, CheckCircle, GenderMale, GenderFemale, Storefront } from '../../ui/icons';
import { api, prettyPhone } from '../../lib/api';
import { pickPhoto, uploadPhoto } from '../../lib/photos';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/i18n';
import { C } from '../../ui/theme';

export default function ProfileSettings() {
  const { t, u } = useLang();
  const { user, setUser } = useAuth();
  const p = user?.workerProfile || {};
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(p.bio || '');
  const [gender, setGender] = useState(p.gender);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  if (!user) return null;
  const changed = () => setSaved(false);

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
      const res = await api('/workers/me', { method: 'PATCH', body: { name: name.trim(), bio: bio.trim(), gender: gender || 'unspecified' } });
      setUser({ ...user, ...res.user });
      setSaved(true);
      setTimeout(() => router.back(), 600);
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Screen
      top={<TopBar title={t('setProfile')} ur={u('setProfile')} />}
      bottom={<Btn kind={saved ? 'leaf' : 'henna'} k={saved ? 'savedOk' : 'saveChanges'} icon={saved ? CheckCircle : undefined} busy={busy} disabled={!name.trim()} onPress={save} />}
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

      <Field label={t('nameQ')} ur={u('nameQ')} hint={t('nameNote')}>
        <Input value={name} onChangeText={(v) => { changed(); setName(v); }} maxLength={60} />
      </Field>
      <Field label={t('aboutMe')} ur={u('aboutMe')}>
        <Input value={bio} onChangeText={(v) => { changed(); setBio(v); }} placeholder={t('aboutMeHint')} multiline maxLength={300} />
      </Field>
      <Field label={t('genderQ')} ur={u('genderQ')} hint={t('genderNote')}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Choice icon={GenderMale} tone="plumber" main={t('man')} ur={u('man')} selected={gender === 'male'} onPress={() => { changed(); setGender('male'); }} />
          <Choice icon={GenderFemale} tone="painter" main={t('woman')} ur={u('woman')} selected={gender === 'female'} onPress={() => { changed(); setGender('female'); }} />
        </View>
      </Field>
    </Screen>
  );
}
