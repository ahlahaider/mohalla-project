// "Me" tab: the worker's settings.
//   - a checklist of what gets them more requests (each item opens the right setting)
//   - My profile, My work, How customers see me
//   - Account: change PIN, change number, language, help, log out, close account
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, BottomNav, Say, L, P, Card, Chip, Avatar, RiseIn, row } from '../ui/kit';
import { Ico, Tap } from '../ui/motion';
import {
  UserCircle, Toolbox, Storefront, Key, Phone, Lifebuoy, SignOut, Trash, CaretRight, Check, Translate, Camera,
  PencilSimple, MapPin, Coins, Bell,
} from '../ui/icons';
import { prettyPhone } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/i18n';
import { C, R } from '../ui/theme';

// What makes a worker easier to find and trust. Each item says where to fix it.
export function checklist(user) {
  const p = user?.workerProfile || {};
  return [
    { k: 'ck_photo', done: Boolean(user?.photoUrl), icon: Camera, go: '/settings/profile' },
    { k: 'ck_bio', done: Boolean(p.bio?.trim()), icon: PencilSimple, go: '/settings/profile' },
    { k: 'ck_areas', done: (p.areasServed || []).length >= 2, icon: MapPin, go: '/settings/work' },
    { k: 'ck_price', done: Boolean(p.priceMin), icon: Coins, go: '/settings/work' },
    { k: 'ck_working', done: Boolean(p.availableToday), icon: Bell, go: '/home' },
  ];
}

function Row({ icon, tone = 'ink', k, hint, onPress, danger, i = 0 }) {
  const { t, u } = useLang();
  return (
    <RiseIn i={i}>
      <Tap onPress={onPress} face={C.card} edge={danger ? C.chilliTint : C.line} border={danger ? C.chilliTint : C.line} radius={R.lg} accessibilityLabel={t(k)}>
        <View style={[row.center, { padding: 12 }]}>
          <Ico icon={icon} tone={tone} motion="wiggle" size={22} box={42} />
          <View style={{ flex: 1 }}>
            <Say main={t(k)} ur={u(k)} size={17} weight="heavy" color={danger ? C.chilliDeep : C.ink} />
            {!!hint && <P size={13} color={C.ink3} weight="semi">{t(hint)}</P>}
          </View>
          <CaretRight size={20} weight="bold" color={danger ? C.chilliDeep : C.ink3} />
        </View>
      </Tap>
    </RiseIn>
  );
}

export default function Me() {
  const { t, u, lang, setLang } = useLang();
  const { user, logout } = useAuth();
  if (!user) return null;
  const items = checklist(user);
  const done = items.filter((x) => x.done).length;

  return (
    <Screen
      nav={<BottomNav active="/me" />}
      top={(
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
          <L k="meTitle" size={26} weight="heavy" />
        </View>
      )}
    >
      {/* who */}
      <Tap onPress={() => router.push('/settings/profile')} face={C.card} edge={C.line} border={C.line} radius={R.lg}>
        <View style={[row.center, { padding: 14 }]}>
          <Avatar name={user.name} photoUrl={user.photoUrl} size={64} tone="#f7d9a8" />
          <View style={{ flex: 1 }}>
            <Say main={user.name} size={20} weight="heavy" />
            <P weight="bold">{prettyPhone(user.phone)}</P>
          </View>
          <CaretRight size={20} weight="bold" color={C.ink3} />
        </View>
      </Tap>

      {/* get more requests */}
      <Card style={done === items.length ? { backgroundColor: C.leafTint, borderColor: C.leafTint } : { backgroundColor: C.saffronTint, borderColor: C.saffron }}>
        <View style={{ gap: 10 }}>
          <View style={row.between}>
            <L k="profileChecklist" size={18} weight="heavy" />
            <P weight="heavy" color={C.ink}>{t('checklistDone', { n: done, total: items.length })}</P>
          </View>
          {/* progress bar */}
          <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <View style={{ width: `${(100 * done) / items.length}%`, height: '100%', backgroundColor: done === items.length ? C.leaf : C.saffronDeep, borderRadius: 5 }} />
          </View>
          {done === items.length ? <P weight="bold" color={C.leafDeep}>{t('checkAllDone')}</P> : items.map((x) => (
            <Tap key={x.k} onPress={() => (x.done ? null : x.go === '/home' ? router.replace('/home') : router.push(x.go))} disabled={x.done} face="transparent" edge="transparent" depth={0} radius={R.md}>
              <View style={[row.center, { paddingVertical: 6 }]}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: x.done ? C.leaf : C.card, borderWidth: x.done ? 0 : 2, borderColor: C.saffronDeep }}>
                  {x.done && <Check size={16} weight="bold" color="#fff" />}
                </View>
                <P weight="bold" color={x.done ? C.ink3 : C.ink} style={[{ flex: 1 }, x.done && { textDecorationLine: 'line-through' }]}>{t(x.k)}</P>
                {!x.done && <CaretRight size={18} weight="bold" color={C.ink} />}
              </View>
            </Tap>
          ))}
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <Row i={0} icon={UserCircle} tone="saffron" k="setProfile" hint="setProfileHint" onPress={() => router.push('/settings/profile')} />
        <Row i={1} icon={Toolbox} tone="electrician" k="setWork" hint="setWorkHint" onPress={() => router.push('/settings/work')} />
        <Row i={2} icon={Storefront} tone="leaf" k="setPreview" hint="setPreviewHint" onPress={() => router.push('/settings/preview')} />
      </View>

      <L k="accountSection" size={17} weight="heavy" color={C.ink3} />
      <View style={{ gap: 10 }}>
        <Row i={3} icon={Key} tone="henna" k="setPin" onPress={() => router.push('/settings/pin')} />
        <Row i={4} icon={Phone} tone="plumber" k="setPhone" onPress={() => router.push('/settings/phone')} />
        <Card pad={12}>
          <View style={{ gap: 10 }}>
            <View style={row.center}>
              <Ico icon={Translate} tone="ink" size={22} box={42} />
              <Say main={t('language')} ur={u('language')} size={17} weight="heavy" />
            </View>
            <View style={row.wrap}>
              <Chip main="English" selected={lang === 'en'} onPress={() => setLang('en')} />
              <Chip main="Roman Urdu" selected={lang === 'roman-ur'} onPress={() => setLang('roman-ur')} />
            </View>
          </View>
        </Card>
        <Row i={5} icon={Lifebuoy} tone="saffron" k="navHelp" onPress={() => router.push('/help')} />
        <Row i={6} icon={SignOut} tone="ink" k="logout" onPress={async () => { await logout(); router.replace('/welcome'); }} />
        <Row i={7} icon={Trash} tone="chilli" k="setClose" danger onPress={() => router.push('/settings/close')} />
      </View>
    </Screen>
  );
}
