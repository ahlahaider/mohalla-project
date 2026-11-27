// Vouch for a new worker: experienced workers (10+ finished jobs) put their own
// name behind a newcomer, found by mobile number. Up to 3 at a time; a vouch can be taken back.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, TopBar, Say, L, P, Btn, LinkBtn, Card, Box, PhoneInput, Avatar, ErrorBox, Loading, row } from '../ui/kit';
import { Ico } from '../ui/motion';
import { Handshake, ShieldCheck, Warning, CheckCircle } from '../ui/icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/i18n';
import { C } from '../ui/theme';

export default function Vouch() {
  const { t, u } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const load = useCallback(() => api('/workers/me/summary').then((d) => setData(d.vouch)).catch(setError), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const vouch = async () => {
    setBusy(true); setError(null); setDone(null);
    try {
      const res = await api('/vouches', { method: 'POST', body: { phone } });
      setDone(res.worker.name); setPhone(''); await load();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const takeBack = async (id) => {
    setError(null);
    try { await api(`/vouches/${id}`, { method: 'DELETE' }); await load(); } catch (err) { setError(err); }
  };

  return (
    <Screen top={<TopBar title={t('vouchTitle')} ur={u('vouchTitle')} />}>
      <Card>
        <View style={{ gap: 12 }}>
          <View style={row.center}>
            <Ico icon={Handshake} tone="saffron" size={30} box={54} motion="wiggle" play />
            <P weight="bold" color={C.ink} style={{ flex: 1 }}>{t('vouchExplain', { name: user?.name })}</P>
          </View>
          <Box tone="saffron">
            <View style={row.center}>
              <Warning size={22} weight="duotone" color="#7a4b00" duotoneColor="#f7c25c" duotoneOpacity={1} />
              <P size={14} color={C.ink} style={{ flex: 1 }}>{t('vouchRisk')}</P>
            </View>
          </Box>
        </View>
      </Card>

      {!data && !error && <Loading />}
      {data && (
        <>
          {data.ok ? (
            <View style={{ gap: 10 }}>
              <L k="theirPhone" size={17} weight="heavy" />
              <PhoneInput value={phone} onChange={setPhone} onSubmit={vouch} />
              <Btn kind="henna" k="vouchBtn" icon={ShieldCheck} disabled={phone.replace(/\D/g, '').length < 10} busy={busy} onPress={vouch} />
              <P size={14} color={C.ink3}>{t('vouchLeft', { n: data.left })}</P>
            </View>
          ) : (
            <Box tone="plain"><P weight="bold">{data.left === 0 ? t('vouchFull', { n: data.max }) : t('vouchRate')}</P></Box>
          )}
          {done && (
            <Box tone="leaf"><View style={row.center}><CheckCircle size={22} weight="fill" color={C.leaf} /><P weight="bold" color={C.leafDeep}>{t('vouchDone', { name: done })}</P></View></Box>
          )}
          <ErrorBox error={error} />

          {data.people.length > 0 && (
            <View style={{ gap: 10 }}>
              <Say main={t('youVouchFor')} ur={u('youVouchFor')} size={18} weight="heavy" />
              {data.people.map((p) => (
                <Card key={p.id} pad={12}>
                  <View style={row.center}>
                    <Avatar name={p.name} size={42} />
                    <P weight="heavy" color={C.ink} style={{ flex: 1 }}>{p.name}</P>
                    <LinkBtn k="takeBack" color={C.chilliDeep} onPress={() => takeBack(p.id)} />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
