// Help: how Mohalla works for workers, the fair rules and the help line. Opened from Me.
import { View, Linking } from 'react-native';
import { Screen, TopBar, Say, L, P, Btn, Card, row } from '../ui/kit';
import { Ico } from '../ui/motion';
import { Bell, Hourglass, Receipt, Money, HandCoins, Star, ShieldCheck, Phone } from '../ui/icons';
import { useLang } from '../lib/i18n';
import { C } from '../ui/theme';

// Fill in the team's help line before the presentation (e.g. '03001234567').
const HELP_PHONE = '';

export default function Help() {
  const { t, u } = useLang();
  const how = [
    ['hw1', Bell, 'saffron', 'ring'],
    ['hw2', Hourglass, 'henna', 'spin'],
    ['hw3', Receipt, 'plumber', 'wiggle'],
    ['hw4', Money, 'leaf', 'roll'],
  ];
  const rules = [['rule1', HandCoins, 'leaf'], ['rule2', Star, 'saffron'], ['rule3', ShieldCheck, 'henna']];
  return (
    <Screen
      top={<TopBar title={t('navHelp')} ur={u('navHelp')} />}
    >
      <Card>
        <View style={{ gap: 14 }}>
          <L k="howTitle" size={19} weight="heavy" urColor={C.hennaDeep} />
          {how.map(([k, icon, tone, motion], i) => (
            <View key={k} style={row.center}>
              <Ico icon={icon} tone={tone} motion={motion} size={24} box={44} play i={i} />
              <Say main={t(k)} ur={u(k)} size={16} weight="bold" style={{ flex: 1 }} />
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ gap: 14 }}>
          <L k="rulesTitle" size={19} weight="heavy" urColor={C.hennaDeep} />
          {rules.map(([k, icon, tone]) => (
            <View key={k} style={row.center}>
              <Ico icon={icon} tone={tone} size={22} box={40} />
              <P color={C.ink} weight="semi" style={{ flex: 1 }}>{t(k)}</P>
            </View>
          ))}
        </View>
      </Card>

      {HELP_PHONE
        ? <Btn kind="saffron" k="helpCall" icon={Phone} motion="ring" onPress={() => Linking.openURL(`tel:${HELP_PHONE}`)} />
        : <P color={C.ink3} align="center">{t('helpNoPhone')}</P>}
    </Screen>
  );
}
