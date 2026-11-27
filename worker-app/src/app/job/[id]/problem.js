// "Problem?": report a dispute about this job to Mohalla.
// Before the work is finished only "not there" and safety problems make sense;
// after it, also payment and price/work problems (within 48 hours).
import { useCallback, useState } from 'react';
import { View, Image } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, L, P, Btn, Box, Input, ErrorBox, Loading, row } from '../../../ui/kit';
import { Ico, Tap } from '../../../ui/motion';
import { UserMinus, HandCoins, Receipt, ShieldWarning, Camera, Images, PaperPlaneTilt, CheckCircle, X } from '../../../ui/icons';
import { api } from '../../../lib/api';
import { pickPhoto, uploadPhoto } from '../../../lib/photos';
import { useLang } from '../../../lib/i18n';
import { C, R } from '../../../ui/theme';

const TYPES = [
  { key: 'no-show', icon: UserMinus, tone: 'saffron', before: true },
  { key: 'non-payment', icon: HandCoins, tone: 'leaf' },
  { key: 'scope', icon: Receipt, tone: 'henna' },
  { key: 'misconduct', icon: ShieldWarning, tone: 'chilli', before: true },
];

export default function Problem() {
  const params = useLocalSearchParams();
  const { id } = params;
  const { t, u } = useLang();
  const [job, setJob] = useState(null);
  const [type, setType] = useState(params.type || null);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]); // [{ uri, url }]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  useFocusEffect(useCallback(() => { api(`/jobs/${id}`).then((d) => setJob(d.job)).catch(setError); }, [id]));

  const addPhoto = async (from) => {
    setError(null);
    try {
      const picked = await pickPhoto(from);
      if (!picked) return;
      setBusy(true);
      const url = await uploadPhoto(picked);
      setPhotos((list) => [...list, { uri: picked.uri, url }].slice(0, 3));
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await api(`/jobs/${id}/disputes`, { method: 'POST', body: { type, text: text.trim(), evidenceUrls: photos.map((p) => p.url) } });
      setSent(true);
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (!job) return <Screen top={<TopBar title={t('problemTitle')} ur={u('problemTitle')} />}>{error ? <ErrorBox error={error} /> : <Loading />}</Screen>;

  const name = job.customer.name.split(' ')[0];
  const finished = job.status === 'completed';
  const types = TYPES.filter((x) => finished || x.before);

  if (sent) {
    return (
      <Screen top={<TopBar title={t('problemTitle')} ur={u('problemTitle')} onBack={() => router.replace(`/job/${id}`)} />} bottom={<Btn kind="henna" k="back" onPress={() => router.replace(`/job/${id}`)} />}>
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 40 }}>
          <Ico icon={CheckCircle} tone="leaf" size={56} box={110} motion="pop" play round />
          <L k="reportSent" size={22} weight="heavy" align="center" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      top={<TopBar title={t('problemTitle')} ur={u('problemTitle')} sub={t('problemSub')} />}
      bottom={<Btn kind="henna" k="sendReport" icon={PaperPlaneTilt} motion="drive" disabled={!type || !text.trim()} busy={busy} onPress={send} />}
    >
      <View style={{ gap: 10 }}>
        {types.map((x, i) => {
          const on = type === x.key;
          return (
            <Tap key={x.key} onPress={() => setType(x.key)} selected={on} face={on ? C.hennaTint : C.card} edge={on ? C.henna : C.line} border={on ? C.henna : C.line} radius={R.lg}>
              <View style={[row.center, { padding: 12 }]}>
                <Ico icon={x.icon} tone={x.tone} size={26} box={46} motion="wiggle" play i={i} />
                <Say main={t(`d_${x.key}`, { name })} ur={u(`d_${x.key}`, { name })} size={17} weight="heavy" style={{ flex: 1 }} />
              </View>
            </Tap>
          );
        })}
      </View>

      {type === 'misconduct' && (
        <Box tone="chilli"><P weight="bold" color={C.chilliDeep}>{t('misconductNote', { name })}</P></Box>
      )}

      <View style={{ gap: 8 }}>
        <L k="tellWhat" size={17} weight="heavy" />
        <Input value={text} onChangeText={setText} multiline maxLength={2000} />
      </View>

      <View style={{ gap: 8 }}>
        <P weight="bold">{t('addProof')}</P>
        {photos.length > 0 && (
          <View style={row.wrap}>
            {photos.map((p) => (
              <View key={p.url}>
                <Image source={{ uri: p.uri }} style={{ width: 84, height: 84, borderRadius: R.sm }} />
                <Tap onPress={() => setPhotos((list) => list.filter((x) => x.url !== p.url))} face={C.ink} edge={C.ink} depth={0} radius={14} style={{ position: 'absolute', top: -8, right: -8 }}>
                  <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><X size={16} weight="bold" color="#fff" /></View>
                </Tap>
              </View>
            ))}
          </View>
        )}
        {photos.length < 3 && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn kind="ghost" k="takePhoto" icon={Camera} small onPress={() => addPhoto('camera')} style={{ flex: 1 }} disabled={busy} />
            <Btn kind="ghost" k="choosePhoto" icon={Images} small onPress={() => addPhoto('gallery')} style={{ flex: 1 }} disabled={busy} />
          </View>
        )}
      </View>

      <ErrorBox error={error} />
      <P size={14} color={C.ink3}>{t('within48')}</P>
    </Screen>
  );
}
