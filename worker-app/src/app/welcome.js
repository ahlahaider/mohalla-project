// Screen 1: Welcome. Three clear doors, so nobody has to guess:
//   I'm new here / I have an account / Someone is helping me (a shop, a friend or family).
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, Awning, Say, L, Card, P } from '../ui/kit';
import { Ico, Tap } from '../ui/motion';
import { UserPlus, Key, UsersThree, CaretRight, CheckCircle } from '../ui/icons';
import { C, F, R } from '../ui/theme';
import { useLang } from '../lib/i18n';

function LangButton() {
  const { t, toggle } = useLang();
  return (
    <Tap onPress={toggle} face="transparent" edge="rgba(255,248,238,0.55)" border="rgba(255,248,238,0.55)" depth={0} radius={R.pill} accessibilityLabel={t('language')}>
      <View style={{ minHeight: 42, paddingHorizontal: 14, justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t('langButton')}</Text>
      </View>
    </Tap>
  );
}

function Door({ icon, tone, motion, k, hint, onPress, i }) {
  const { t, u } = useLang();
  return (
    <Tap onPress={onPress} face={C.card} edge={C.line} border={C.line} radius={R.lg} accessibilityLabel={t(k)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <Ico icon={icon} tone={tone} motion={motion} size={32} box={62} play i={i} />
        <View style={{ flex: 1 }}>
          <Say main={t(k)} ur={u(k)} size={20} weight="heavy" urColor={C.hennaDeep} />
          <P size={14} color={C.ink3} weight="semi">{t(hint)}</P>
        </View>
        <CaretRight size={24} weight="bold" color={C.ink} />
      </View>
    </Tap>
  );
}

export default function Welcome() {
  return (
    <Screen
      topColor={C.henna}
      top={(
        <Awning>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 34, lineHeight: 38, color: C.cream, letterSpacing: -0.8 }}>mohalla</Text>
              <Text style={{ fontFamily: F.urdu, fontSize: 17, lineHeight: 30, color: C.creamUr }}>محلہ</Text>
            </View>
            <LangButton />
          </View>
          <L k="tagline" size={28} weight="heavy" color={C.cream} urColor={C.creamUr} urSize={20} />
        </Awning>
      )}
    >
      <View style={{ gap: 14, marginTop: 8 }}>
        <Door i={0} icon={UserPlus} tone="saffron" motion="wiggle" k="doorNew" hint="doorNewHint" onPress={() => router.push('/signup')} />
        <Door i={1} icon={Key} tone="leaf" motion="wiggle" k="doorHave" hint="doorHaveHint" onPress={() => router.push('/login')} />
        <Door i={2} icon={UsersThree} tone="plumber" motion="roll" k="doorHelped" hint="doorHelpedHint" onPress={() => router.push({ pathname: '/signup', params: { helped: '1' } })} />
      </View>
      <Card style={{ backgroundColor: C.leafTint, borderColor: C.leafTint, marginTop: 10 }} pad={14}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ico icon={CheckCircle} tone="leaf" size={26} box={40} motion="pop" play i={3} />
          <L k="freeForever" size={17} weight="heavy" color={C.leafDeep} />
        </View>
      </Card>
    </Screen>
  );
}
