// Me → How customers see me: the worker's card exactly as customers see it in search
// (photo, name, rating, jobs done, starting price, free today, areas), from the public API.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, P, Btn, Card, Box, Tag, Avatar, Loading, ErrorBox, row } from '../../ui/kit';
import { Ico } from '../../ui/motion';
import { CATEGORY, Star, CheckCircle, MapPin, SealCheck, Handshake, PencilSimple } from '../../ui/icons';
import { api, rupees } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useLang } from '../../lib/i18n';
import { C } from '../../ui/theme';

export default function Preview() {
  const { t, u, cat, areaName } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useFocusEffect(useCallback(() => {
    if (user) api(`/workers/${user.id}`).then(setData).catch(setError);
  }, [user]));

  const w = data?.worker;
  const p = w?.workerProfile || {};
  const rel = w?.reliability || {};

  return (
    <Screen top={<TopBar title={t('setPreview')} ur={u('setPreview')} />}>
      <P>{t('previewNote')}</P>
      <ErrorBox error={error} />
      {!w && !error && <Loading />}
      {w && (
        <Card>
          <View style={{ gap: 12 }}>
            <View style={[row.center, { alignItems: 'flex-start' }]}>
              <Avatar name={w.name} photoUrl={w.photoUrl} size={64} tone="#f7d9a8" />
              <View style={{ flex: 1, gap: 4 }}>
                <Say main={w.name} size={19} weight="heavy" />
                <View style={row.wrap}>
                  {w.badges?.verified && <Tag tone="leaf">ID ✓</Tag>}
                  {w.badges?.founding && <Tag tone="henna">Founding</Tag>}
                  {rel.isNew && <Tag tone="soft">{t('newWorker')}</Tag>}
                  {p.availableToday && <Tag tone="saffron">{t('freeToday')}</Tag>}
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Box tone="plain" style={{ flex: 1, alignItems: 'center' }}>
                <View style={row.center}><Star size={18} weight="fill" color={C.saffron} /><Say main={w.rating ? String(w.rating.avg) : '—'} size={20} weight="heavy" /></View>
                <P size={12} weight="bold" color={C.ink3}>{w.rating ? t('ratedYou', { n: w.rating.count }) : t('noRatings')}</P>
              </Box>
              <Box tone="plain" style={{ flex: 1, alignItems: 'center' }}>
                <View style={row.center}><CheckCircle size={18} weight="fill" color={C.leaf} /><Say main={String(rel.completed ?? 0)} size={20} weight="heavy" /></View>
                <P size={12} weight="bold" color={C.ink3}>{t('jobsDone')}</P>
              </Box>
              <Box tone="plain" style={{ flex: 1, alignItems: 'center' }}>
                <Say main={p.priceMin ? rupees(p.priceMin) : '—'} size={17} weight="heavy" />
                <P size={12} weight="bold" color={C.ink3}>{t('startingPrice')}</P>
              </Box>
            </View>
            <View style={row.wrap}>
              {(p.skills || []).map((s) => {
                const c = CATEGORY[s];
                return (
                  <View key={s} style={row.center}>
                    {c && <Ico icon={c.icon} tone={s} size={16} box={28} round />}
                    <P weight="bold" color={C.ink}>{cat(s)}</P>
                  </View>
                );
              })}
            </View>
            <View style={[row.center, { alignItems: 'flex-start' }]}>
              <MapPin size={18} weight="fill" color={C.henna} />
              <P style={{ flex: 1 }}>{(p.areasServed || []).map(areaName).join(' · ')}</P>
            </View>
            {!!p.bio && <Box tone="plain"><P color={C.ink}>“{p.bio}”</P></Box>}
            {data.vouchedBy?.length > 0 && (
              <View style={row.center}>
                <Handshake size={18} color={C.leafDeep} />
                <P weight="bold" color={C.leafDeep}>{data.vouchedBy.map((v) => v.name).join(', ')}</P>
              </View>
            )}
            {!w.photoUrl && (
              <View style={row.center}><SealCheck size={16} color={C.saffronDeep} /><P size={14} weight="bold" color={C.saffronDeep}>{t('ck_photo')}</P></View>
            )}
          </View>
        </Card>
      )}
      <Btn kind="ghost" k="setProfile" icon={PencilSimple} small onPress={() => router.push('/settings/profile')} />
      <Btn kind="ghost" k="setWork" icon={PencilSimple} small onPress={() => router.push('/settings/work')} />
    </Screen>
  );
}
