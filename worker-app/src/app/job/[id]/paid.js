// Screen 8: Got paid and rate the customer. Two last taps:
//   1 Did you get the cash? (yes = the agreed price, or type a different amount)
//   2 How was the customer? (stars stay hidden until the customer rates too)
// Getting less than agreed offers "Report a problem" straight away.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, L, P, Btn, Card, Box, Input, StarsInput, ErrorBox, Loading, row } from '../../../ui/kit';
import { Ico } from '../../../ui/motion';
import { Money, Check, PencilSimple, Warning, Heart, CheckCircle } from '../../../ui/icons';
import { api, rupees } from '../../../lib/api';
import { useLang } from '../../../lib/i18n';
import { C } from '../../../ui/theme';

export default function GotPaid() {
  const { id, only } = useLocalSearchParams();
  const { t, u } = useLang();
  const [job, setJob] = useState(null);
  const [cash, setCash] = useState(null); // 'yes' | 'diff'
  const [other, setOther] = useState('');
  const [paidDone, setPaidDone] = useState(only === 'rate');
  const [stars, setStars] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [thanks, setThanks] = useState(false);

  useFocusEffect(useCallback(() => {
    api(`/jobs/${id}`).then((d) => {
      setJob(d.job);
      if (d.job.payment?.workerAmount != null) setPaidDone(true);
    }).catch(setError);
  }, [id]));

  if (!job) return <Screen top={<TopBar title={t('workDone')} ur={u('workDone')} />}>{error ? <ErrorBox error={error} /> : <Loading />}</Screen>;

  const name = job.customer.name.split(' ')[0];
  const got = cash === 'yes' ? job.total : Number(other || 0);
  const less = paidDone && job.payment?.workerAmount != null && job.payment.workerAmount < job.total;

  const confirmCash = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api(`/jobs/${id}/payment`, { method: 'POST', body: { amount: got } });
      setJob({ ...job, payment: res.payment });
      setPaidDone(true);
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  const rate = async () => {
    setBusy(true); setError(null);
    try {
      if (!job.reviewedByMe) await api(`/jobs/${id}/review`, { method: 'POST', body: { stars } });
      setThanks(true);
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (thanks) {
    return (
      <Screen top={<TopBar title={t('workDone')} ur={u('workDone')} onBack={() => router.replace('/home')} />} bottom={<Btn kind="henna" k="backToJobs" onPress={() => router.replace('/home')} />}>
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 40 }}>
          <Ico icon={Heart} tone="henna" size={56} box={110} motion="pop" play round />
          <L k="thanks" size={30} weight="heavy" align="center" />
          <P align="center">{t('thanksNote')}</P>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      top={<TopBar title={t('workDone')} ur={u('workDone')} sub={t('workDoneSub', { name })} />}
      bottom={!paidDone
        ? <Btn kind="leaf" k="continue" icon={Check} disabled={!cash || (cash === 'diff' && !other)} busy={busy} onPress={confirmCash} />
        : <Btn kind="henna" k="done" icon={CheckCircle} motion="pop" disabled={!stars && !job.reviewedByMe} busy={busy} onPress={rate} />}
    >
      <ErrorBox error={error} />

      {/* 1 · cash */}
      {!paidDone ? (
        <View style={{ gap: 14 }}>
          <View style={row.center}>
            <Ico icon={Money} tone="leaf" size={28} box={48} motion="roll" play />
            <L k="cashQ" size={22} weight="heavy" style={{ flex: 1 }} />
          </View>
          <Box tone="plain">
            <View style={row.between}>
              <P weight="bold">{t('agreedPrice')}</P>
              <Say main={rupees(job.total)} size={22} weight="heavy" />
            </View>
          </Box>
          <Btn kind={cash === 'yes' ? 'leaf' : 'ghost'} main={t('yesGot', { amount: rupees(job.total) })} ur={u('yesGot', { amount: rupees(job.total) })} icon={Check} onPress={() => setCash('yes')} />
          <Btn kind={cash === 'diff' ? 'saffron' : 'ghost'} k="gotDifferent" icon={PencilSimple} small onPress={() => setCash('diff')} />
          {cash === 'diff' && (
            <View style={{ gap: 8 }}>
              <P weight="bold">{t('typeGot')}</P>
              <Input value={other} onChangeText={(v) => setOther(v.replace(/\D/g, '').slice(0, 7))} keyboardType="number-pad" inputMode="numeric" big autoFocus />
            </View>
          )}
        </View>
      ) : (
        <Card pad={14}>
          <View style={row.center}>
            <CheckCircle size={26} weight="fill" color={C.leaf} />
            <P weight="heavy" color={C.leafDeep}>{t('youGot', { amount: rupees(job.payment?.workerAmount) })}</P>
          </View>
        </Card>
      )}

      {less && (
        <Box tone="chilli">
          <View style={row.center}>
            <Warning size={24} weight="duotone" color={C.chilliDeep} duotoneColor="#f19aa1" duotoneOpacity={1} />
            <P weight="bold" color={C.chilliDeep} style={{ flex: 1 }}>{t('lessNote')}</P>
          </View>
          {!job.dispute && <Btn kind="ghostChilli" k="reportIt" small onPress={() => router.push({ pathname: `/job/${id}/problem`, params: { type: 'non-payment' } })} style={{ marginTop: 10 }} />}
        </Box>
      )}

      {/* 2 · rate the customer */}
      {paidDone && !job.reviewedByMe && (
        <Card>
          <View style={{ gap: 14 }}>
            <Say main={t('howWas', { name })} ur={u('howWas', { name })} size={20} weight="heavy" align="center" />
            <StarsInput value={stars} onChange={setStars} />
            <P size={14} color={C.ink3} align="center">{t('ratingHidden', { name })}</P>
          </View>
        </Card>
      )}
    </Screen>
  );
}
