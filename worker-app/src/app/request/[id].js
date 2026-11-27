// Screen 4: New request. Everything the worker needs to say yes or no:
// time left, who the customer is (rating from other workers, paid-in-full record),
// what's wrong (with any photos), when, and that the full address comes after "yes".
import { useCallback, useEffect, useState } from 'react';
import { View, Image, ScrollView } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, L, P, Btn, Card, Box, Chip, Avatar, Ring, Sheet, Loading, ErrorBox, row } from '../../ui/kit';
import { Ico, Tap } from '../../ui/motion';
import { CATEGORY, Star, MapPin, Lock, SunHorizon, Sun, Moon, Check, X, SealCheck } from '../../ui/icons';
import { api, photoUri } from '../../lib/api';
import { useLang } from '../../lib/i18n';
import { splitProblem } from '../../lib/jobs';
import { whenParts, timeLeft, slotKey } from '../../lib/when';
import { C, R } from '../../ui/theme';

const SLOT_ICON = { morning: SunHorizon, afternoon: Sun, evening: Moon };

export default function NewRequest() {
  const { id } = useLocalSearchParams();
  const l = useLang();
  const { t, u, areaName, areaU } = l;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmNo, setConfirmNo] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [, tick] = useState(0);

  const load = useCallback(() => api(`/jobs/${id}`).then((d) => { setJob(d.job); setError(null); }).catch(setError), [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { const timer = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(timer); }, []);

  // Once answered, this job belongs on the job page.
  useEffect(() => { if (job && job.status !== 'requested' && ['accepted', 'agreed', 'completed'].includes(job.status)) router.replace(`/job/${job.id}`); }, [job]);

  const answer = async (yes) => {
    setBusy(true);
    try {
      await api(`/jobs/${id}/${yes ? 'accept' : 'decline'}`, { method: 'POST' });
      setConfirmNo(false);
      if (yes) router.replace(`/job/${id}`); else router.replace('/home');
    } catch (err) { setError(err); setConfirmNo(false); load(); } finally { setBusy(false); }
  };

  if (!job) {
    return <Screen top={<TopBar title={t('newRequest')} ur={u('newRequest')} />}>{error ? <ErrorBox error={error} onRetry={load} /> : <Loading />}</Screen>;
  }

  const left = timeLeft(job.expiresAt, l);
  const open = job.status === 'requested' && left;
  const p = splitProblem(job, l);
  const c = CATEGORY[job.category];
  const cust = job.customer;
  const when = whenParts(job.preferredTime, l);
  const SlotIcon = SLOT_ICON[slotKey(job.preferredTime)] || Sun;
  const isNewCustomer = !cust.jobsCompleted;

  return (
    <Screen
      top={<TopBar title={t('newRequest')} ur={u('newRequest')} />}
      bottom={open ? (
        <>
          <Btn kind="leaf" k="yesGo" icon={Check} motion="pop" onPress={() => answer(true)} busy={busy} />
          <Btn kind="ghostChilli" k="noCant" icon={X} small onPress={() => setConfirmNo(true)} disabled={busy} />
        </>
      ) : <Btn kind="henna" k="backToJobs" onPress={() => router.replace('/home')} />}
    >
      <ErrorBox error={error} />

      {open ? (
        <Box tone="saffron" dashed>
          <View style={row.center}>
            <Ring fraction={left.fraction} size={56} label={`${left.h || left.m}${left.h ? 'h' : 'm'}`} />
            <Say main={t('answerWithin', { time: left.text })} ur={u('answerWithin', { time: left.textU })} size={18} weight="heavy" style={{ flex: 1 }} />
          </View>
        </Box>
      ) : (
        <Box tone="chilli"><P weight="bold" color={C.chilliDeep}>{t(job.status === 'expired' || !left ? 'requestExpired' : 'requestClosed')}</P></Box>
      )}

      {/* who is asking */}
      <Card>
        <View style={{ gap: 14 }}>
          <View style={row.center}>
            <Avatar name={cust.name} photoUrl={cust.photoUrl} size={56} tone="#f6dfe3" />
            <View style={{ flex: 1 }}>
              <Say main={cust.name} size={21} weight="heavy" />
              <View style={row.center}>
                <MapPin size={18} weight="fill" color={C.henna} />
                <P weight="bold">{areaName(job.area)}</P>
              </View>
            </View>
          </View>
          {isNewCustomer ? (
            <Box tone="plain">
              <View style={row.center}>
                <Ico icon={SealCheck} tone="saffron" size={22} box={38} />
                <View style={{ flex: 1 }}>
                  <P weight="heavy" color={C.ink}>{t('newCustomer')}</P>
                  <P size={14} color={C.ink3}>{t('newCustomerHint')}</P>
                </View>
              </View>
            </Box>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Box tone="plain" style={{ flex: 1, alignItems: 'center' }}>
                <View style={row.center}>
                  <Star size={22} weight="fill" color={C.saffron} />
                  <Say main={cust.rating ? String(cust.rating.avg) : '—'} size={22} weight="heavy" />
                </View>
                <P size={13} weight="bold" color={C.ink2} align="center">{cust.rating ? t('workersRating') : t('noRatingYet')}</P>
              </Box>
              <Box tone="leaf" style={{ flex: 1, alignItems: 'center' }}>
                <Say main={`${cust.paidOnRecord ?? 0} / ${cust.jobsCompleted}`} size={22} weight="heavy" color={C.leafDeep} />
                <P size={13} weight="bold" color={C.leafDeep} align="center">{t('paidInFull')}</P>
              </Box>
            </View>
          )}
        </View>
      </Card>

      {/* what's wrong */}
      <Card>
        <View style={{ gap: 12 }}>
          <View style={row.center}>
            {c && <Ico icon={c.icon} tone={job.category} motion={c.motion} size={24} box={42} play />}
            <Say main={t('whatsWrong')} ur={u('whatsWrong')} size={18} weight="heavy" urColor={C.hennaDeep} />
          </View>
          <View style={row.wrap}>
            <Chip main={p.title} ur={p.titleU} selected onPress={() => {}} />
          </View>
          {!!p.details && (
            <Box tone="plain"><P size={16} color={C.ink}>“{p.details}”</P></Box>
          )}
          {job.photos?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {job.photos.map((ph) => (
                <Tap key={ph} onPress={() => setPhoto(ph)} face={C.paperDeep} edge={C.line} radius={R.md} depth={3}>
                  <Image source={{ uri: photoUri(ph) }} style={{ width: 110, height: 110, borderRadius: R.md }} />
                </Tap>
              ))}
            </ScrollView>
          )}
        </View>
      </Card>

      {/* when and where */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }} pad={12}>
          <View style={row.center}>
            <Ico icon={SlotIcon} tone="saffron" size={22} box={40} motion="roll" />
            <View style={{ flex: 1 }}>
              <Say main={when?.day || '—'} ur={when?.dayU} size={17} weight="heavy" />
              <P size={14} weight="semi">{when?.slot}</P>
            </View>
          </View>
        </Card>
        <Card style={{ flex: 1 }} pad={12}>
          <View style={row.center}>
            <Ico icon={Lock} tone="ink" size={22} box={40} />
            <View style={{ flex: 1 }}>
              <P size={14} weight="heavy" color={C.ink}>{t('addressAfterYes')}</P>
              <P size={13} color={C.ink3}>{areaName(job.area)} · {areaU(job.area)}</P>
            </View>
          </View>
        </Card>
      </View>

      <Sheet open={confirmNo} onClose={() => setConfirmNo(false)}>
        <L k="declineQ" size={22} weight="heavy" />
        <P>{t('declineNote', { name: cust.name })}</P>
        <Btn kind="chilli" k="yesDecline" icon={X} onPress={() => answer(false)} busy={busy} />
        <Btn kind="ghost" k="goBack" onPress={() => setConfirmNo(false)} />
      </Sheet>

      <Sheet open={Boolean(photo)} onClose={() => setPhoto(null)}>
        {photo && <Image source={{ uri: photoUri(photo) }} style={{ width: '100%', aspectRatio: 0.8, borderRadius: R.md, backgroundColor: C.paperDeep }} resizeMode="contain" />}
        <Btn kind="ghost" k="close" onPress={() => setPhoto(null)} />
      </Sheet>
    </Screen>
  );
}
