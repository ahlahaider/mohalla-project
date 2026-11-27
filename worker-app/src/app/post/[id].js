// A posted job: see the problem and the customer, then send your full price.
// If the customer picks you, it becomes a normal job (with the address) on your Jobs tab.
import { useCallback, useState } from 'react';
import { View, Image, ScrollView } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, L, P, Btn, Card, Box, Chip, Avatar, AmountPad, Field, Input, Loading, ErrorBox, row } from '../../ui/kit';
import { Ico } from '../../ui/motion';
import { CATEGORY, Star, MapPin, Lock, PaperPlaneTilt, CheckCircle, Hourglass, SealCheck } from '../../ui/icons';
import { api, rupees, photoUri } from '../../lib/api';
import { useLang } from '../../lib/i18n';
import { splitProblem } from '../../lib/jobs';
import { whenText, timeLeft } from '../../lib/when';
import { C, R } from '../../ui/theme';

export default function PostedJob() {
  const { id } = useLocalSearchParams();
  const l = useLang();
  const { t, u, areaName } = l;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api(`/jobs/${id}`).then((d) => {
    // Picked: it's my job now, so show the normal job page.
    if (d.job.myRole === 'worker' && d.job.worker && ['agreed', 'accepted', 'completed'].includes(d.job.status)) router.replace(`/job/${id}`);
    setJob(d.job); setError(null);
  }).catch(setError), [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await api(`/jobs/${id}/quotes`, { method: 'POST', body: { amount: Number(amount), note: note.trim() || undefined } });
      await load();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (!job) return <Screen top={<TopBar title={t('nearTitle')} ur={u('nearTitle')} />}>{error ? <ErrorBox error={error} onRetry={load} /> : <Loading />}</Screen>;

  const p = splitProblem(job, l);
  const c = CATEGORY[job.category];
  const name = job.customer?.name?.split(' ')[0] || '';
  const left = timeLeft(job.expiresAt, l);
  const open = job.status === 'open' && left;
  const cust = job.customer;

  return (
    <Screen
      top={<TopBar title={p.title} ur={p.titleU} sub={`${name} · ${areaName(job.area)}`} />}
      bottom={open && !job.myQuote ? (
        <Btn kind="henna" k="sendTo" vars={{ name }} icon={PaperPlaneTilt} motion="drive" disabled={!(Number(amount) > 0)} busy={busy} onPress={send} />
      ) : undefined}
    >
      <ErrorBox error={error} />

      {job.myQuote ? (
        <Box tone="leaf">
          <View style={row.center}>
            <CheckCircle size={26} weight="fill" color={C.leaf} />
            <View style={{ flex: 1 }}>
              <Say main={t('youSent', { amount: rupees(job.myQuote.amount) })} ur={u('youSent', { amount: rupees(job.myQuote.amount) })} size={18} weight="heavy" color={C.leafDeep} />
              {open && <P color={C.leafDeep}>{t('waitingPick', { name })}</P>}
            </View>
          </View>
        </Box>
      ) : !open && (
        <Box tone="chilli"><P weight="bold" color={C.chilliDeep}>{t('postClosed')}</P></Box>
      )}
      {open && (
        <View style={row.center}>
          <Hourglass size={18} weight="fill" color={C.saffronDeep} />
          <P weight="bold" color={C.saffronDeep}>{t('closesIn', { time: left.text })} · {job.quotesCount ? t(job.quotesCount === 1 ? 'price1Sent' : 'pricesSent', { n: job.quotesCount }) : t('noPricesYet')}</P>
        </View>
      )}

      {/* the job */}
      <Card>
        <View style={{ gap: 12 }}>
          <View style={row.center}>
            {c && <Ico icon={c.icon} tone={job.category} motion={c.motion} size={24} box={42} play />}
            <Say main={t('whatsWrong')} ur={u('whatsWrong')} size={18} weight="heavy" urColor={C.hennaDeep} />
          </View>
          <View style={row.wrap}><Chip main={p.title} ur={p.titleU} selected onPress={() => {}} /></View>
          {!!p.details && <Box tone="plain"><P size={16} color={C.ink}>“{p.details}”</P></Box>}
          {job.photos?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {job.photos.map((ph) => <Image key={ph} source={{ uri: photoUri(ph) }} style={{ width: 110, height: 110, borderRadius: R.md, backgroundColor: C.paperDeep }} />)}
            </ScrollView>
          )}
          <P weight="bold" color={C.ink}>{whenText(job.preferredTime, l)}</P>
          <View style={row.center}>
            <Lock size={18} color={C.ink3} />
            <P size={14} color={C.ink3}>{t('addressAfterPick')} · {areaName(job.area)}</P>
          </View>
        </View>
      </Card>

      {/* the customer */}
      {cust && (
        <Card pad={14}>
          <View style={row.center}>
            <Avatar name={cust.name} photoUrl={cust.photoUrl} size={48} tone="#f6dfe3" />
            <View style={{ flex: 1 }}>
              <P weight="heavy" color={C.ink} size={17}>{cust.name}</P>
              {cust.jobsCompleted
                ? <P size={14} weight="bold">{cust.rating ? `★ ${cust.rating.avg} · ` : ''}{cust.paidOnRecord ?? 0}/{cust.jobsCompleted} {t('paidInFull')}</P>
                : <View style={row.center}><SealCheck size={16} color={C.saffronDeep} /><P size={14} weight="bold" color={C.saffronDeep}>{t('newCustomer')}</P></View>}
            </View>
          </View>
        </Card>
      )}

      {/* send a price */}
      {open && !job.myQuote && (
        <View style={{ gap: 14 }}>
          <L k="sendYourPrice" size={20} weight="heavy" />
          <AmountPad value={amount} onChange={setAmount} quick={[1000, 1500, 2500, 3000]} />
          <Field label={t('bidNoteLabel')} ur={u('bidNoteLabel')}>
            <Input value={note} onChangeText={setNote} placeholder={t('bidNoteExample')} maxLength={300} />
          </Field>
          <Box tone="saffron"><P size={14} color={C.ink}>{t('bidNote')}</P></Box>
        </View>
      )}
    </Screen>
  );
}
