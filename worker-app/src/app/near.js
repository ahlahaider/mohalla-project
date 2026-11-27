// "Jobs near you" tab: jobs customers posted for anyone to price, in the worker's
// services and areas. Send a price; the customer picks one worker.
// Below: the prices this worker already sent and what happened to each.
import { useCallback, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, BottomNav, Say, L, P, Card, Tag, Note, Loading, ErrorBox, RiseIn, row } from '../ui/kit';
import { Ico, Tap } from '../ui/motion';
import { CATEGORY, MapPin, CaretRight, Hourglass, CheckCircle } from '../ui/icons';
import { api, rupees } from '../lib/api';
import { useLang } from '../lib/i18n';
import { splitProblem } from '../lib/jobs';
import { whenText, timeLeft } from '../lib/when';
import { C, R } from '../ui/theme';

const POLL_MS = 30000;
const OUTCOME_TONE = { waiting: 'soft', won: 'leaf', lost: 'soft', closed: 'soft' };

export default function Near() {
  const l = useLang();
  const { t, u, areaName } = l;
  const [jobs, setJobs] = useState(null);
  const [bids, setBids] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [open, mine] = await Promise.all([api('/jobs/open'), api('/jobs/bids')]);
      setJobs(open.jobs);
      setBids(mine.bids);
      setError(null);
    } catch (err) { setError(err); }
  }, []);
  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]));

  const fresh = (jobs || []).filter((j) => !j.alreadyQuoted);
  const pastBids = bids.filter((b) => b.outcome !== 'waiting' || !(jobs || []).some((j) => j.id === b.id));

  return (
    <Screen
      nav={<BottomNav active="/near" badges={{ '/near': fresh.length }} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.henna} />}
      top={(
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, gap: 4 }}>
          <L k="nearTitle" size={26} weight="heavy" />
        </View>
      )}
    >
      <P>{t('nearSub')}</P>
      <ErrorBox error={error} onRetry={load} />
      {!jobs && !error && <Loading />}

      {jobs && jobs.length === 0 && (
        <Note icon={MapPin} tone="leaf" boxTone="plain" motion="roll">
          <P weight="bold" color={C.ink}>{t('nearNone')}</P>
          <P size={14} color={C.ink3}>{t('nearNoneHint')}</P>
        </Note>
      )}

      {(jobs || []).map((j, i) => {
        const p = splitProblem(j, l);
        const c = CATEGORY[j.category];
        const left = timeLeft(j.expiresAt, l);
        return (
          <RiseIn key={j.id} i={i}>
            <Tap onPress={() => router.push(`/post/${j.id}`)} face={j.alreadyQuoted ? C.card : C.leafTint} edge={j.alreadyQuoted ? C.line : C.leaf} border={j.alreadyQuoted ? C.line : C.leaf} radius={R.lg}>
              <View style={{ padding: 14, gap: 10 }}>
                <View style={[row.center, { alignItems: 'flex-start' }]}>
                  {c && <Ico icon={c.icon} tone={j.category} motion={c.motion} size={26} box={48} play i={i} />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Say main={p.title} ur={p.titleU} size={18} weight="heavy" />
                    <P size={14} weight="bold" color={C.ink}>{j.customer?.name} · {areaName(j.area)} · {whenText(j.preferredTime, l)}</P>
                  </View>
                  <CaretRight size={22} weight="bold" color={C.ink} />
                </View>
                <View style={[row.between, { flexWrap: 'wrap' }]}>
                  {j.myQuote
                    ? <Tag tone="ink">{t('youSent', { amount: rupees(j.myQuote.amount) })}</Tag>
                    : <Tag tone="leaf">{j.quotesCount ? t(j.quotesCount === 1 ? 'price1Sent' : 'pricesSent', { n: j.quotesCount }) : t('noPricesYet')}</Tag>}
                  {left && (
                    <View style={row.center}>
                      <Hourglass size={16} weight="fill" color={C.saffronDeep} />
                      <P size={13} weight="bold" color={C.saffronDeep}>{t('closesIn', { time: left.text })}</P>
                    </View>
                  )}
                </View>
              </View>
            </Tap>
          </RiseIn>
        );
      })}

      {pastBids.length > 0 && (
        <>
          <L k="myPrices" size={19} weight="heavy" urColor={C.hennaDeep} style={{ marginTop: 6 }} />
          {pastBids.map((b, i) => {
            const c = CATEGORY[b.category];
            const won = b.outcome === 'won';
            return (
              <RiseIn key={b.id} i={i}>
                <Tap onPress={() => router.push(`/job/${b.id}`)} disabled={!won} face={C.card} edge={won ? C.leaf : C.line} border={won ? C.leaf : C.line} radius={R.lg}>
                  <View style={[row.center, { padding: 12 }]}>
                    {c && <Ico icon={c.icon} tone={b.category} size={20} box={38} />}
                    <View style={{ flex: 1, gap: 4 }}>
                      <P weight="heavy" color={C.ink}>{b.description.split('. ')[0]} · {areaName(b.area)}</P>
                      <View style={row.center}>
                        {won && <CheckCircle size={16} weight="fill" color={C.leaf} />}
                        <Tag tone={OUTCOME_TONE[b.outcome]}>{t(`bid_${b.outcome}`)}</Tag>
                      </View>
                    </View>
                    <P weight="heavy" color={C.ink} size={16}>{rupees(b.amount)}</P>
                  </View>
                </Tap>
              </RiseIn>
            );
          })}
        </>
      )}
    </Screen>
  );
}
