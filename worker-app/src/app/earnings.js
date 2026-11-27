// Screen 9: My earnings. Cash this week / month, plain counts (not a made-up score),
// the last finished jobs, and vouching for new workers (locked until 10 finished jobs).
import { useCallback, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, BottomNav, Say, L, P, Card, Box, Avatar, Loading, ErrorBox, RiseIn, row } from '../ui/kit';
import { Ico, Tap } from '../ui/motion';
import { Coins, Star, CheckCircle, Hourglass, Handshake, Lock, CaretRight, CalendarCheck, ClipboardText } from '../ui/icons';
import { api, rupees } from '../lib/api';
import { useLang } from '../lib/i18n';
import { shortDate } from '../lib/when';
import { C, F, R } from '../ui/theme';

function Tile({ icon, tone, motion, value, label, i }) {
  return (
    <Card style={{ flex: 1, minWidth: '30%' }} pad={12}>
      <View style={{ gap: 6 }}>
        <Ico icon={icon} tone={tone} motion={motion} size={20} box={36} play i={i} />
        <Say main={value} size={22} weight="heavy" />
        <P size={13} weight="bold" color={C.ink3}>{label}</P>
      </View>
    </Card>
  );
}

export default function Earnings() {
  const l = useLang();
  const { t, u, areaName } = l;
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((p = period) => api(`/workers/me/summary?period=${p}`).then((d) => { setData(d); setError(null); }).catch(setError), [period]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const v = data?.vouch;
  const vouchText = !v ? '' : v.revoked ? t('vouchRevoked') : v.needJobs > 0 ? t('vouchLocked', { n: v.needJobs }) : !v.ok && v.left > 0 ? t('vouchRate') : v.left > 0 ? t('vouchLeft', { n: v.left }) : t('vouchFull', { n: v.max });
  const canOpenVouch = v && !v.revoked && v.needJobs === 0;

  return (
    <Screen
      nav={<BottomNav active="/earnings" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.henna} />}
      top={(
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, backgroundColor: C.paper }}>
          <L k="navEarnings" size={26} weight="heavy" />
        </View>
      )}
    >
      {/* week / month switch */}
      <View style={{ flexDirection: 'row', backgroundColor: C.paperDeep, borderRadius: R.pill, padding: 4 }}>
        {['week', 'month'].map((p) => {
          const on = period === p;
          const k = p === 'week' ? 'thisWeek' : 'thisMonth';
          return (
            <Tap key={p} onPress={() => { setPeriod(p); load(p); }} face={on ? C.ink : 'transparent'} edge={on ? '#000' : 'transparent'} depth={on ? 2 : 0} radius={R.pill} style={{ flex: 1 }} selected={on}>
              <View style={{ minHeight: 46, alignItems: 'center', justifyContent: 'center' }}>
                <Say main={t(k)} size={16} weight="heavy" color={on ? '#fff' : C.ink2} align="center" />
              </View>
            </Tap>
          );
        })}
      </View>

      <ErrorBox error={error} onRetry={() => load()} />
      {!data && !error && <Loading />}

      {data && (
        <>
          <RiseIn>
            <View style={{ backgroundColor: C.leaf, borderRadius: R.lg, borderBottomWidth: 5, borderBottomColor: C.leafDeep, padding: 18, gap: 4 }}>
              <View style={row.between}>
                <Say main={t('cashYouGot')} ur={u('cashYouGot')} size={17} weight="heavy" color="#e5f5ea" urColor="#cdebd6" />
                <Ico icon={Coins} motion="roll" size={28} box={46} play colors={['rgba(255,255,255,0.16)', '#f7c25c', '#fff']} />
              </View>
              <Say main={rupees(data.cash)} size={40} weight="heavy" color="#fff" />
              <P size={15} weight="bold" color="#e5f5ea">{data.jobs} {t('jobsWord')}</P>
            </View>
          </RiseIn>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Tile i={0} icon={Star} tone="saffron" motion="pop" value={data.rating ? String(data.rating.avg) : '—'} label={data.rating ? t('ratedYou', { n: data.rating.count }) : t('noRatings')} />
            <Tile i={1} icon={CheckCircle} tone="leaf" motion="pop" value={`${data.completed}/${data.accepted}`} label={t('jobsFinished')} />
            <Tile i={2} icon={CalendarCheck} tone="plumber" motion="wiggle" value={data.onTimePct == null ? '—' : `${data.onTimePct}%`} label={t('onTime')} />
          </View>

          <L k="lastJobs" size={19} weight="heavy" urColor={C.hennaDeep} />
          {data.recent.length === 0 && (
            <Box tone="plain"><View style={row.center}><ClipboardText size={22} color={C.ink3} /><P style={{ flex: 1 }}>{t('noFinished')}</P></View></Box>
          )}
          {data.recent.map((j, i) => (
            <RiseIn key={j.id} i={i}>
              <Tap onPress={() => router.push(`/job/${j.id}`)} face={C.card} edge={C.line} border={C.line} radius={R.lg}>
                <View style={[row.center, { padding: 12 }]}>
                  <Avatar name={j.customer} size={44} tone="#e3eef7" />
                  <View style={{ flex: 1 }}>
                    <P weight="heavy" color={C.ink}>{j.customer} · {areaName(j.area)}</P>
                    <P size={14} color={C.ink3}>{shortDate(j.completedAt, l)}</P>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <P weight="heavy" color={C.ink} size={17}>{rupees(j.amount)}</P>
                    {j.paid
                      ? <View style={row.center}><CheckCircle size={14} weight="fill" color={C.leaf} /><P size={13} weight="bold" color={C.leafDeep}>{t('paidMark')}</P></View>
                      : <View style={row.center}><Hourglass size={14} weight="fill" color={C.saffronDeep} /><P size={13} weight="bold" color={C.saffronDeep}>{t('confirmCash')}</P></View>}
                  </View>
                </View>
              </Tap>
            </RiseIn>
          ))}

          {/* vouching */}
          <Tap onPress={() => canOpenVouch && router.push('/vouch')} disabled={!canOpenVouch} face={canOpenVouch ? C.saffronTint : C.paperDeep} edge={canOpenVouch ? C.saffron : C.line} border={canOpenVouch ? C.saffron : C.line} radius={R.lg}>
            <View style={[row.center, { padding: 14 }]}>
              <Ico icon={canOpenVouch ? Handshake : Lock} tone={canOpenVouch ? 'saffron' : 'ink'} motion="wiggle" size={28} box={50} />
              <View style={{ flex: 1 }}>
                <Say main={t('trustNew')} ur={u('trustNew')} size={18} weight="heavy" />
                <P size={14} weight="semi">{vouchText}</P>
              </View>
              {canOpenVouch && <CaretRight size={22} weight="bold" color={C.ink} />}
            </View>
          </Tap>
        </>
      )}
    </Screen>
  );
}
