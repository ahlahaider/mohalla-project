// Screen 3: Worker home ("Jobs" tab).
//   - big "I'm working today" switch (customers only find workers who are on)
//   - new requests, each with a ring showing the time left to answer
//   - my jobs that are going on, each saying whose turn it is
// It checks for new requests every 15 seconds while open and buzzes when one arrives.
import { useCallback, useRef, useState } from 'react';
import { View, RefreshControl, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Awning, BottomNav, Say, L, P, Btn, Card, Tag, Avatar, Ring, Toggle, Loading, ErrorBox, RiseIn, Note, row } from '../ui/kit';
import { Ico, Tap } from '../ui/motion';
import { CATEGORY } from '../ui/icons';
import { Bell, ClipboardText, MapPin, CaretRight } from '../ui/icons';
import { api, rupees, firstName } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/i18n';
import { splitProblem, workerStatus, isActive, isNewRequest } from '../lib/jobs';
import { whenText, timeLeft } from '../lib/when';
import { C, F, R } from '../ui/theme';

const POLL_MS = 15000;

export default function Home() {
  const l = useLang();
  const { t, u, areaName } = l;
  const { user, setUser } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [nearCount, setNearCount] = useState(0); // posted jobs near me I haven't sent a price for
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const known = useRef(null); // ids of requests we've already seen, to buzz only for new ones

  const load = useCallback(async () => {
    try {
      const [res, near] = await Promise.all([api('/jobs/mine'), api('/jobs/open').catch(() => ({ jobs: [] }))]);
      setNearCount(near.jobs.filter((j) => !j.alreadyQuoted).length);
      const ids = res.jobs.filter(isNewRequest).map((j) => j.id);
      if (known.current && ids.some((id) => !known.current.has(id)) && Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      known.current = new Set(ids);
      setJobs(res.jobs);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]));

  const working = Boolean(user?.workerProfile?.availableToday);
  const switchWorking = async () => {
    setSwitching(true);
    try {
      const res = await api('/workers/me/availability', { method: 'PATCH', body: { availableToday: !working } });
      setUser({ ...user, workerProfile: { ...user.workerProfile, availableToday: res.availableToday } });
    } catch (err) { setError(err); } finally { setSwitching(false); }
  };

  const requests = (jobs || []).filter(isNewRequest);
  const active = (jobs || []).filter(isActive);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <Screen
      topColor={C.henna}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.henna} />}
      nav={<BottomNav active="/home" badges={{ '/home': requests.length, '/near': nearCount }} />}
      top={(
        <Awning>
          <View style={row.center}>
            <Tap onPress={() => router.replace('/me')} face="transparent" edge="transparent" depth={0} radius={30} accessibilityLabel={t('meTitle')}>
              <View style={{ borderWidth: 3, borderColor: C.saffron, borderRadius: 32 }}>
                <Avatar name={user?.name} photoUrl={user?.photoUrl} size={54} tone="#f7d9a8" />
              </View>
            </Tap>
            <Say main={t('salaam', { name: firstName(user?.name) })} ur={u('salaam', { name: '' }).replace(/[،,]\s*$/, '')} size={22} weight="heavy" color={C.cream} urColor={C.creamUr} style={{ flex: 1 }} />
          </View>
          <Tap onPress={switchWorking} disabled={switching} face="rgba(0,0,0,0.16)" edge="rgba(0,0,0,0.16)" depth={0} radius={R.lg} accessibilityRole="switch" selected={working}>
            <View style={[row.between, { padding: 14 }]}>
              <View style={{ flex: 1 }}>
                <Say main={t(working ? 'workingToday' : 'notWorking')} ur={u(working ? 'workingToday' : 'notWorking')} size={20} weight="heavy" color={C.cream} urColor={C.creamUr} />
                <P size={14} color="#fbe3d4" weight="semi">{t(working ? 'workingOnHint' : 'workingOffHint')}</P>
              </View>
              <Toggle on={working} />
            </View>
          </Tap>
        </Awning>
      )}
    >
      <ErrorBox error={error} onRetry={load} />
      {!jobs && !error && <Loading />}

      {jobs && (
        <>
          {/* new requests */}
          <View style={row.between}>
            <L k="newRequests" size={20} weight="heavy" />
            {requests.length > 0 && (
              <View style={{ minWidth: 30, height: 30, borderRadius: 15, backgroundColor: C.saffron, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <Say main={String(requests.length)} size={16} weight="heavy" />
              </View>
            )}
          </View>
          {requests.length === 0 && (
            <Note icon={Bell} tone="saffron" boxTone="plain" motion="ring">
              <P weight="bold" color={C.ink}>{t('noRequests')}</P>
              <P size={14} color={C.ink3}>{t('noRequestsHint')}</P>
            </Note>
          )}
          {requests.map((j, i) => <RequestCard key={j.id} job={j} i={i} l={l} />)}

          {/* posted jobs near me, waiting for my price */}
          {nearCount > 0 && (
            <Tap onPress={() => router.replace('/near')} face={C.leafTint} edge={C.leaf} border={C.leaf} radius={R.lg}>
              <View style={[row.center, { padding: 14 }]}>
                <Ico icon={MapPin} tone="leaf" motion="roll" size={26} box={46} play />
                <Say main={t(nearCount === 1 ? 'nearTeaser1' : 'nearTeaser', { n: nearCount })} ur={u(nearCount === 1 ? 'nearTeaser1' : 'nearTeaser', { n: nearCount })} size={17} weight="heavy" color={C.leafDeep} style={{ flex: 1 }} />
                <CaretRight size={22} weight="bold" color={C.leafDeep} />
              </View>
            </Tap>
          )}

          {/* jobs going on */}
          <L k="myJobs" size={20} weight="heavy" style={{ marginTop: 4 }} />
          {active.length === 0 && (
            <Note icon={ClipboardText} tone="ink" boxTone="plain">
              <P weight="bold" color={C.ink}>{t('noJobs')}</P>
            </Note>
          )}
          {active.map((j, i) => {
            const st = workerStatus(j);
            const c = CATEGORY[j.category];
            return (
              <RiseIn key={j.id} i={i}>
                <Tap onPress={() => router.push(`/job/${j.id}`)} face={C.card} edge={C.line} border={C.line} radius={R.lg}>
                  <View style={[row.center, { padding: 14 }]}>
                    <View>
                      <Avatar name={j.customer} photoUrl={j.otherPhotoUrl} size={50} tone="#e3eef7" />
                      {c && <Ico icon={c.icon} tone={j.category} motion={c.motion} size={14} box={24} round style={{ position: 'absolute', right: -4, bottom: -4, borderWidth: 2, borderColor: C.card }} />}
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <P weight="heavy" color={C.ink} size={17}>{j.customer} · {areaName(j.area)}</P>
                      <Tag tone={st.tone}>{t(st.k)}</Tag>
                    </View>
                    <P weight="heavy" color={C.ink} size={17}>{j.total ? rupees(j.total) : ''}</P>
                  </View>
                </Tap>
              </RiseIn>
            );
          })}
          <P size={14} color={C.ink3} align="center">{t('finishedInEarnings')}</P>
        </>
      )}
    </Screen>
  );
}

function RequestCard({ job, i, l }) {
  const { t, u, areaName } = l;
  const left = timeLeft(job.expiresAt, l);
  const p = splitProblem(job, l);
  return (
    <RiseIn i={i}>
      <Card style={{ backgroundColor: C.saffronTint, borderColor: C.saffron }}>
        <View style={{ gap: 14 }}>
          <View style={[row.center, { alignItems: 'flex-start' }]}>
            <Ring fraction={left?.fraction ?? 0} label={left ? `${left.h || left.m}${left.h ? 'h' : 'm'}` : '0'} sub={t('left')} />
            <View style={{ flex: 1, gap: 2 }}>
              <Say main={p.title} ur={p.titleU} size={19} weight="heavy" />
              <P size={15} weight="bold" color={C.ink}>{job.customer} · {areaName(job.area)} · {whenText(job.preferredTime, l)}</P>
            </View>
          </View>
          <Btn kind="henna" main={t('seeRequest')} ur={u('seeRequest')} small onPress={() => router.push(`/request/${job.id}`)} />
        </View>
      </Card>
    </RiseIn>
  );
}
