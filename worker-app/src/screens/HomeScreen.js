// Worker home: the "available today" switch, then jobs in four tabs.
// New requests can be accepted or declined right from the list with big
// green / red buttons, without opening the job.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { api, rupees } from '../api';
import { Btn, Card, ErrorText, H, Muted, s, C, T } from '../ui';

const TABS = {
  new: (j) => j.status === 'requested',
  active: (j) => ['accepted', 'agreed'].includes(j.status),
  done: (j) => ['completed', 'declined', 'expired', 'cancelled'].includes(j.status),
};

export default function HomeScreen({ nav, i18n, user, setUser }) {
  const { t, cat, catIcon, areaName, status, toggleLang, lang } = i18n;
  const [tab, setTab] = useState('new');
  const [jobs, setJobs] = useState([]);
  const [open, setOpen] = useState([]);
  const [available, setAvailable] = useState(!!user.workerProfile?.availableToday);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [mine, openJobs] = await Promise.all([api('/jobs/mine'), api('/jobs/open')]);
      setJobs(mine.jobs);
      setOpen(openJobs.jobs);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggleAvailable(v) {
    setAvailable(v);
    try {
      await api('/workers/me/availability', { method: 'PATCH', body: { availableToday: v } });
      setUser({ ...user, workerProfile: { ...user.workerProfile, availableToday: v } });
    } catch (e) {
      setAvailable(!v);
      setError(e.message);
    }
  }

  async function answer(id, action) {
    try {
      await api(`/jobs/${id}/${action}`, { method: 'POST' });
      if (action === 'accept') nav.push('job', { id });
      else load();
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  const list = tab === 'open' ? open : jobs.filter(TABS[tab]);
  const count = (k) => (k === 'open' ? open.filter((j) => !j.alreadyQuoted).length : jobs.filter(TABS[k]).length);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
        <H style={{ marginBottom: 0 }}>{user.name}</H>
        <View style={s.row}>
          <Btn title={lang === 'en' ? 'Roman Urdu' : 'English'} onPress={toggleLang} />
          <Btn title={t('logout')} onPress={nav.logout} />
        </View>
      </View>

      <Card style={{ backgroundColor: available ? '#DCEFE4' : C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T style={{ fontSize: 20, fontWeight: '700', color: available ? C.green : C.muted }}>
          {available ? `● ${t('available')}` : `○ ${t('notAvailable')}`}
        </T>
        <Switch value={available} onValueChange={toggleAvailable} trackColor={{ true: C.green }} />
      </Card>

      <View style={[s.row, { marginBottom: 12, flexWrap: 'nowrap' }]}>
        {[['new', '🔔', t('tabNew')], ['active', '🛠️', t('tabActive')], ['open', '📋', t('tabOpen')], ['done', '🏁', t('tabDone')]].map(([k, icon, label]) => (
          <Pressable key={k} onPress={() => setTab(k)}
            style={[s.card, { flex: 1, marginBottom: 0, padding: 8, alignItems: 'center' }, tab === k && { borderColor: C.terracotta, backgroundColor: '#FBE3D6' }]}>
            <T style={{ fontSize: 24 }}>{icon}</T>
            <T style={{ fontSize: 13, fontWeight: '700' }}>{label} ({count(k)})</T>
          </Pressable>
        ))}
      </View>

      <ErrorText>{error}</ErrorText>
      {list.length === 0 && <Muted style={{ textAlign: 'center', marginTop: 24 }}>{t('nothing')}</Muted>}

      {list.map((j) => (
        <Pressable key={j.id} onPress={() => nav.push('job', { id: j.id })}>
          <Card>
            <View style={[s.row, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}>
              <T style={s.big}>{catIcon(j.category)}</T>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700', fontSize: 18 }}>{cat(j.category)} · 📍 {areaName(j.area)}</T>
                <T numberOfLines={2}>{j.description}</T>
                {j.preferredTime && <Muted>🕒 {new Date(j.preferredTime).toLocaleString()}</Muted>}
                {tab !== 'open' && <Muted>{status(j.status)}{j.total ? ` · ${rupees(j.total)}` : ''}</Muted>}
                {j.alreadyQuoted && <Muted>✓ {t('quoted')}</Muted>}
              </View>
            </View>
            {tab === 'new' && (
              <View style={[s.row, { marginTop: 12, flexWrap: 'nowrap' }]}>
                <Btn kind="go" icon="✓" title={t('accept')} style={{ flex: 1 }} onPress={() => answer(j.id, 'accept')} />
                <Btn kind="stop" icon="✕" title={t('decline')} style={{ flex: 1 }} onPress={() => answer(j.id, 'decline')} />
              </View>
            )}
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
