// Screen 7: Add a part with a photo of the shop bill.
//   1 photo of the bill (camera, or gallery)   2 what part?   3 how much?
// The customer sees the bill photo before saying OK: it protects both sides.
import { useCallback, useState } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, P, Btn, Box, Chip, AmountPad, Input, ErrorBox, Loading, row } from '../../../ui/kit';
import { Ico, Tap } from '../../../ui/motion';
import { Camera, Images, PaperPlaneTilt, ShieldCheck } from '../../../ui/icons';
import { api } from '../../../lib/api';
import { pickPhoto, uploadPhoto } from '../../../lib/photos';
import { useLang, PARTS } from '../../../lib/i18n';
import { C, R } from '../../../ui/theme';

function Num({ n }) {
  return (
    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.henna, alignItems: 'center', justifyContent: 'center' }}>
      <Say main={String(n)} size={15} weight="heavy" color="#fff" align="center" />
    </View>
  );
}

export default function AddPart() {
  const { id } = useLocalSearchParams();
  const { t, u, pick, pickU } = useLang();
  const [job, setJob] = useState(null);
  const [photo, setPhoto] = useState(null);   // { uri, base64 }
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [part, setPart] = useState(null);     // index into PARTS, or 'other'
  const [other, setOther] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(useCallback(() => { api(`/jobs/${id}`).then((d) => setJob(d.job)).catch(setError); }, [id]));

  const parts = PARTS[job?.category] || [];
  const name = job?.customer.name.split(' ')[0] || '';
  // Saved in English (like the customer's problem chips) so the record reads the same for everyone.
  const partName = part === 'other' ? other.trim() : parts[part]?.[0];
  const ready = photoUrl && partName && Number(amount) > 0;

  // Upload straight after picking, so "Send" is instant.
  const choose = async (from) => {
    setError(null);
    try {
      const picked = await pickPhoto(from);
      if (!picked) return;
      setPhoto(picked); setPhotoUrl(null); setUploading(true);
      setPhotoUrl(await uploadPhoto(picked));
    } catch (err) { setError(err); setPhoto(null); } finally { setUploading(false); }
  };

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await api(`/jobs/${id}/agreement`, { method: 'POST', body: { kind: 'part', amount: Number(amount), scope: partName, billPhotoUrl: photoUrl } });
      router.back();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Screen
      top={<TopBar title={t('addPartTitle')} ur={u('addPartTitle')} />}
      bottom={job ? <Btn kind="henna" main={t('sendTo', { name })} ur={u('sendTo', { name })} icon={PaperPlaneTilt} motion="drive" disabled={!ready} busy={busy} onPress={send} /> : undefined}
    >
      {!job && !error && <Loading />}
      {job && (
        <>
          {/* 1 · bill photo */}
          <View style={row.center}><Num n={1} /><Say main={t('billPhoto')} ur={u('billPhoto')} size={18} weight="heavy" /></View>
          <Tap onPress={() => choose('camera')} face={photo ? C.card : C.paperDeep} edge={C.line} border={C.line} radius={R.lg}>
            {photo ? (
              <View>
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 220, borderRadius: R.lg - 2 }} resizeMode="cover" />
                {uploading && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43,29,23,0.45)', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: R.lg }}>
                    <ActivityIndicator color="#fff" size="large" />
                    <P color="#fff" weight="bold">{t('uploading')}</P>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ height: 170, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ico icon={Camera} tone="henna" size={38} box={70} motion="pop" play />
                <Say main={t('tapToPhoto')} ur={u('tapToPhoto')} size={17} weight="heavy" align="center" />
              </View>
            )}
          </Tap>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {photo && <Btn kind="ghost" k="retake" icon={Camera} small onPress={() => choose('camera')} style={{ flex: 1 }} />}
            <Btn kind="ghost" k="choosePhoto" icon={Images} small onPress={() => choose('gallery')} style={{ flex: 1 }} />
          </View>

          {/* 2 · what part */}
          <View style={row.center}><Num n={2} /><Say main={t('whatPart')} ur={u('whatPart')} size={18} weight="heavy" /></View>
          <View style={row.wrap}>
            {parts.map((r, i) => <Chip key={r[0]} main={pick(r)} ur={pickU(r)} selected={part === i} onPress={() => setPart(i)} />)}
            <Chip main={t('partOther')} ur={u('partOther')} selected={part === 'other'} onPress={() => setPart('other')} />
          </View>
          {part === 'other' && <Input value={other} onChangeText={setOther} placeholder={t('partName')} maxLength={80} autoFocus />}

          {/* 3 · how much */}
          <View style={row.center}><Num n={3} /><Say main={t('howMuch')} ur={u('howMuch')} size={18} weight="heavy" /></View>
          <AmountPad value={amount} onChange={setAmount} />

          <Box tone="leaf">
            <View style={row.center}>
              <ShieldCheck size={24} weight="duotone" color={C.leafDeep} duotoneColor="#8fd0a5" duotoneOpacity={1} />
              <P size={15} color={C.leafDeep} weight="semi" style={{ flex: 1 }}>{t('partNote', { name })}</P>
            </View>
          </Box>
        </>
      )}
      <ErrorBox error={error} />
    </Screen>
  );
}
