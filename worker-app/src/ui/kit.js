// Shared pieces for every screen, matching the customer website (web/src/ui/kit.jsx + app.css).
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { C, F, R } from './theme';
import { Ico, Tap } from './motion';
import { CaretLeft, ClipboardText, Money, MapPin, UserCircle, Backspace, Star, Warning } from './icons';
import { useLang } from '../lib/i18n';
import { errorText, initials, photoUri } from '../lib/api';

const native = Platform.OS !== 'web';

// ---------- text ----------
// Main line (English or Roman Urdu, follows the toggle) with Urdu script beneath it.
export function Say({ main, ur, size = 17, weight = 'bold', color = C.ink, urColor, urSize, align = 'left', lines, style }) {
  const center = align === 'center';
  // Outer box: lets a row centre it vertically. Inner box: as wide as the longer line,
  // so the Urdu line sits right-aligned under the English, like the website.
  return (
    <View style={[{ flexShrink: 1, maxWidth: '100%', justifyContent: 'center' }, style]}>
      <View style={{ alignSelf: center ? 'center' : 'flex-start', maxWidth: '100%' }}>
      <Text numberOfLines={lines} style={{ fontFamily: F[weight], fontSize: size, lineHeight: Math.round(size * 1.25), color, textAlign: center ? 'center' : 'left' }}>{main}</Text>
      {!!ur && (
        <Text style={{ fontFamily: F.urdu, fontSize: urSize ?? Math.max(13, Math.round(size * 0.82)), lineHeight: Math.round((urSize ?? size * 0.82) * 1.75), color: urColor ?? color, opacity: urColor ? 1 : 0.85, writingDirection: 'rtl', textAlign: center ? 'center' : 'right' }}>{ur}</Text>
      )}
      </View>
    </View>
  );
}

// <L k="workQ" /> = Say with that string key in both scripts.
export function L({ k, vars, ...rest }) {
  const { t, u } = useLang();
  return <Say main={t(k, vars)} ur={u(k, vars)} {...rest} />;
}

export function P({ children, size = 16, color = C.ink2, weight = 'regular', align, style }) {
  return <Text style={[{ fontFamily: F[weight], fontSize: size, lineHeight: Math.round(size * 1.4), color, textAlign: align }, style]}>{children}</Text>;
}

export function H({ children, size = 22, color = C.ink, style }) {
  return <Text style={[{ fontFamily: F.heavy, fontSize: size, lineHeight: Math.round(size * 1.2), color }, style]}>{children}</Text>;
}

export const SectionLabel = ({ children }) => (
  <Text style={{ fontFamily: F.heavy, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: C.ink3 }}>{children}</Text>
);

// ---------- buttons ----------
const BTN = {
  leaf: [C.leaf, C.leafDeep, '#fff'],
  henna: [C.henna, C.hennaDeep, '#fff'],
  saffron: [C.saffron, C.saffronDeep, C.ink],
  chilli: [C.chilli, C.chilliDeep, '#fff'],
  wa: [C.wa, C.waDeep, '#fff'],
  ink: [C.ink, '#000', '#fff'],
  ghost: [C.card, C.line, C.ink, C.line],
  ghostChilli: [C.card, C.chilliTint, C.chilliDeep, C.chilliTint],
  off: ['#dccdb9', '#c3b199', '#fffaf3'],
};

// kind: colour (see BTN). icon + motion: a Phosphor icon that dances when pressed.
export function Btn({ kind = 'leaf', main, ur, k, vars, icon, motion = 'wiggle', iconTone, onPress, disabled, busy, small, style }) {
  const { t, u } = useLang();
  const [face, edge, text, border] = BTN[disabled ? 'off' : kind];
  const label = k ? t(k, vars) : main;
  const urdu = k ? u(k, vars) : ur;
  return (
    <Tap onPress={onPress} disabled={disabled || busy} face={face} edge={edge} border={disabled ? undefined : border} style={style} accessibilityLabel={label}>
      <View style={{ minHeight: small ? 50 : 60, paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {busy ? <ActivityIndicator color={text} /> : icon && (
          <Ico icon={icon} motion={motion} size={small ? 22 : 26} box={small ? 32 : 38} round colors={iconTone ? undefined : [border ? C.paperDeep : 'rgba(255,255,255,0.18)', '#f7c25c', text]} tone={iconTone} />
        )}
        <Say main={label} ur={urdu} size={small ? 17 : 20} weight="heavy" color={text} align={icon ? 'left' : 'center'} />
      </View>
    </Tap>
  );
}

// A plain underlined text button ("Change number", "Forgot PIN?").
export function LinkBtn({ k, vars, main, color = C.hennaDeep, onPress, center }) {
  const { t } = useLang();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 12, paddingHorizontal: 6, minHeight: 48, alignSelf: center ? 'center' : 'flex-start', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.bold, fontSize: 16, color, textDecorationLine: 'underline' }}>{k ? t(k, vars) : main}</Text>
    </Pressable>
  );
}

// ---------- chips & choices ----------
export function Chip({ selected, icon, tone = 'ink', motion = 'wiggle', main, ur, onPress, disabled, style, grow }) {
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      selected={selected}
      face={selected ? C.henna : C.card}
      edge={selected ? C.hennaDeep : C.line}
      border={selected ? C.hennaDeep : C.line}
      radius={R.pill}
      depth={3}
      style={[grow && { flexGrow: 1, flexBasis: '45%' }, disabled && { opacity: 0.45 }, style]}
    >
      <View style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: icon ? 6 : 16, paddingRight: 16, paddingVertical: 4 }}>
        {icon && <Ico icon={icon} tone={tone} motion={motion} size={22} box={36} round colors={selected ? ['rgba(255,255,255,0.18)', '#f7c25c', '#fff'] : undefined} />}
        <Say main={main} ur={ur} size={16} color={selected ? '#fff' : C.ink} urColor={selected ? '#ffe9df' : undefined} />
      </View>
    </Tap>
  );
}

// Big square choice (two side by side): yes/no, channel, man/woman.
export function Choice({ selected, variant, icon, tone, motion = 'wiggle', main, ur, hint, onPress, disabled }) {
  const sel = variant === 'yes' ? [C.leaf, C.leafTint] : variant === 'no' ? [C.chilli, C.chilliTint] : [C.henna, C.hennaTint];
  return (
    <Tap onPress={onPress} disabled={disabled} selected={selected} face={selected ? sel[1] : C.card} edge={selected ? sel[0] : C.line} border={selected ? sel[0] : C.line} radius={R.lg} style={{ flex: 1 }}>
      <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 }}>
        {icon && <Ico icon={icon} tone={tone} motion={motion} size={34} box={58} />}
        <Say main={main} ur={ur} size={18} weight="heavy" align="center" />
        {!!hint && <P size={13} color={C.ink3} align="center">{hint}</P>}
      </View>
    </Tap>
  );
}

// ---------- boxes ----------
export const Card = ({ children, style, pad = 16 }) => (
  <View style={[{ backgroundColor: C.card, borderRadius: R.lg, borderWidth: 2, borderBottomWidth: 6, borderColor: C.line, padding: pad }, style]}>{children}</View>
);

const BOX = { plain: C.paperDeep, leaf: C.leafTint, saffron: C.saffronTint, chilli: C.chilliTint, henna: C.hennaTint };
export const Box = ({ tone = 'plain', children, style, dashed }) => (
  <View style={[{ backgroundColor: BOX[tone], borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 14 }, dashed && { borderWidth: 2, borderStyle: 'dashed', borderColor: tone === 'saffron' ? C.saffron : C.line }, style]}>{children}</View>
);

// A row with an icon and some words, inside a soft box.
export function Note({ icon, tone = 'saffron', boxTone, children, motion }) {
  return (
    <Box tone={boxTone ?? (tone === 'chilli' ? 'chilli' : tone === 'leaf' ? 'leaf' : tone === 'henna' ? 'henna' : tone === 'saffron' ? 'saffron' : 'plain')}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {icon && <Ico icon={icon} tone={tone} size={24} box={40} motion={motion} play={Boolean(motion)} />}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </Box>
  );
}

const TAG = { saffron: [C.saffron, C.ink], leaf: [C.leaf, '#fff'], chilli: [C.chilli, '#fff'], ink: [C.ink, '#fff'], soft: [C.paperDeep, C.ink2], henna: [C.henna, '#fff'] };
export const Tag = ({ tone = 'saffron', children }) => (
  <View style={{ alignSelf: 'flex-start', backgroundColor: TAG[tone][0], borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 2 }}>
    <Text style={{ fontFamily: F.heavy, fontSize: 13, color: TAG[tone][1] }}>{children}</Text>
  </View>
);

// ---------- screen frame ----------
// Every screen: warm paper background, safe areas, a scrolling body and an optional
// sticky bar at the bottom (main buttons) or the bottom navigation.
export function Screen({ children, top, bottom, nav, scroll = true, pad = 18, bg = C.paper, topColor, refreshControl, scrollRef }) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView ref={scrollRef} contentContainerStyle={{ padding: pad, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
      {children}
    </ScrollView>
  ) : <View style={{ flex: 1, padding: pad, gap: 18 }}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: topColor || bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          {top}
          <View style={{ flex: 1 }}>{body}</View>
          {bottom && (
            <View style={{ padding: 14, paddingBottom: 14 + insets.bottom, gap: 10, backgroundColor: C.paper, borderTopWidth: 2, borderTopColor: C.line }}>{bottom}</View>
          )}
          {nav}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Top of inner screens: a big round back button and the title.
export function TopBar({ title, ur, sub, onBack, right }) {
  const { t } = useLang();
  const back = onBack || (() => (router.canGoBack() ? router.back() : router.replace('/home')));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.paper, borderBottomWidth: 2, borderBottomColor: C.line }}>
      <Tap onPress={back} face={C.card} edge={C.line} border={C.line} radius={26} depth={3} accessibilityLabel={t('back')}>
        <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
          <CaretLeft size={24} weight="bold" color={C.ink} />
        </View>
      </Tap>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Say main={title} ur={ur} size={21} weight="heavy" lines={2} />
        {typeof sub === 'string' ? <P size={14} color={C.ink3} weight="semi">{sub}</P> : sub}
      </View>
      {right}
    </View>
  );
}

// Home header: a henna awning with a saffron scalloped edge (like a shop front).
export function Awning({ children }) {
  return (
    <View style={{ zIndex: 2 }}>
      <View style={{ backgroundColor: C.henna, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 20, gap: 14 }}>{children}</View>
      <Scallops />
    </View>
  );
}

export function Scallops() {
  return (
    <View style={{ height: 13, flexDirection: 'row', overflow: 'hidden', marginTop: -1 }} pointerEvents="none">
      {Array.from({ length: 30 }, (_, i) => (
        <View key={i} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.saffron, marginTop: -12, marginRight: 2 }} />
      ))}
    </View>
  );
}

// The dark bar at the bottom of the four main screens. `badges` shows a red count on a tab.
const TABS = [
  { href: '/home', k: 'navJobs', icon: ClipboardText, motion: 'wiggle' },
  { href: '/near', k: 'navNear', icon: MapPin, motion: 'roll' },
  { href: '/earnings', k: 'navEarnings', icon: Money, motion: 'roll' },
  { href: '/me', k: 'navMe', icon: UserCircle, motion: 'wiggle' },
];
export function BottomNav({ active, badges = {} }) {
  const { t, u } = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.ink, padding: 6, paddingBottom: 6 + insets.bottom }}>
      {TABS.map((tab) => {
        const on = tab.href === active;
        return (
          <Tap key={tab.href} onPress={() => !on && router.replace(tab.href)} face={on ? 'rgba(255,255,255,0.07)' : 'transparent'} edge="transparent" depth={0} radius={12} style={{ flex: 1 }} accessibilityLabel={t(tab.k)} selected={on}>
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <View>
                <Ico icon={tab.icon} motion={tab.motion} size={24} box={34} colors={['transparent', on ? 'rgba(242,165,49,0.55)' : 'rgba(242,165,49,0.35)', on ? C.saffron : '#f3e6d3']} />
                {badges[tab.href] > 0 && (
                  <View style={{ position: 'absolute', right: -10, top: -2, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.chilli, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                    <Text style={{ color: '#fff', fontFamily: F.heavy, fontSize: 13 }}>{badges[tab.href]}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: on ? C.saffron : '#f3e6d3' }}>{t(tab.k)}</Text>
              <Text style={{ fontFamily: F.urdu, fontSize: 11, lineHeight: 18, color: on ? '#f7c25c' : '#cdb9a3' }}>{u(tab.k)}</Text>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

// ---------- pop-up sheet ----------
export function Sheet({ open, onClose, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(43,29,23,0.45)' }} onPress={onClose} accessibilityLabel="close" />
      <View style={{ backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 20 + insets.bottom, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <View style={{ alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: C.line }} />
        {children}
      </View>
    </Modal>
  );
}

// ---------- PIN & keypad ----------
export function PinBoxes({ value, length = 4, hidden = true }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
      {Array.from({ length }, (_, i) => {
        const filled = i < value.length;
        const current = i === value.length;
        return (
          <View key={i} style={{ width: 58, height: 66, borderRadius: R.md, borderWidth: 2, borderBottomWidth: 5, borderColor: current ? C.henna : C.line, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
            {filled && (hidden ? <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.ink }} /> : <Text style={{ fontFamily: F.heavy, fontSize: 28, color: C.ink }}>{value[i]}</Text>)}
          </View>
        );
      })}
    </View>
  );
}

// Big number pad. `extra` is the key left of 0 ('' = none, '00' for amounts).
export function Keypad({ onKey, onDelete, extra = '', disabled }) {
  const { t } = useLang();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', extra, '0', 'del'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {keys.map((k, i) => (
        <View key={i} style={{ width: '31%', flexGrow: 1 }}>
          {k === '' ? <View style={{ height: 60 }} /> : (
            <Tap onPress={() => (k === 'del' ? onDelete() : onKey(k))} disabled={disabled} face={C.card} edge={C.line} border={C.line} radius={R.md} depth={3} haptic accessibilityLabel={k === 'del' ? t('deleteKey') : k}>
              <View style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                {k === 'del' ? <Backspace size={28} weight="duotone" color={C.ink} duotoneColor="#e9cfae" duotoneOpacity={1} /> : <Text style={{ fontFamily: F.heavy, fontSize: 26, color: C.ink }}>{k}</Text>}
              </View>
            </Tap>
          )}
        </View>
      ))}
    </View>
  );
}

// Big "Rs 2,500" display with quick amounts and a keypad, for prices.
export function AmountPad({ value, onChange, quick = [] }) {
  const n = Number(value || 0);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, paddingVertical: 6 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink3 }}>Rs</Text>
        <Text style={{ fontFamily: F.heavy, fontSize: 52, lineHeight: 60, color: value ? C.ink : C.line }}>{n.toLocaleString('en-PK')}</Text>
      </View>
      {quick.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {quick.map((q) => (
            <Chip key={q} main={q.toLocaleString('en-PK')} selected={n === q} onPress={() => onChange(String(q))} />
          ))}
        </View>
      )}
      <Keypad
        extra="00"
        onKey={(k) => { const next = (value === '0' ? '' : value || '') + k; if (next.length <= 7) onChange(next.replace(/^0+/, '') || ''); }}
        onDelete={() => onChange((value || '').slice(0, -1))}
      />
    </View>
  );
}

// ---------- inputs ----------
export function Field({ label, ur, hint, children }) {
  return (
    <View style={{ gap: 8 }}>
      {!!label && <Say main={label} ur={ur} size={17} weight="heavy" />}
      {children}
      {!!hint && <P size={14} color={C.ink3}>{hint}</P>}
    </View>
  );
}

export function Input({ style, big, ...props }) {
  return (
    <TextInput
      placeholderTextColor={C.ink3}
      style={[{ minHeight: big ? 64 : 56, borderRadius: R.md, borderWidth: 2, borderColor: C.line, backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 10, fontFamily: big ? F.heavy : F.semi, fontSize: big ? 26 : 18, color: C.ink, letterSpacing: big ? 1 : 0 }, props.multiline && { minHeight: 110, textAlignVertical: 'top' }, style]}
      {...props}
    />
  );
}

// Mobile number box with the 03xx format.
export function PhoneInput({ value, onChange, onSubmit, autoFocus }) {
  return (
    <Input
      big
      value={value}
      onChangeText={(v) => onChange(v.replace(/[^\d+ -]/g, '').slice(0, 15))}
      keyboardType="phone-pad"
      inputMode="tel"
      placeholder="03xx xxxxxxx"
      autoComplete="tel"
      textContentType="telephoneNumber"
      autoFocus={autoFocus}
      onSubmitEditing={onSubmit}
      returnKeyType="next"
    />
  );
}

// ---------- people ----------
export function Avatar({ name, photoUrl, size = 52, tone = C.paperDeep }) {
  if (photoUrl) {
    return <Image source={{ uri: photoUri(photoUrl) }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.paperDeep }} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.heavy, fontSize: size * 0.36, color: C.ink }}>{initials(name)}</Text>
    </View>
  );
}

export function StarsInput({ value, onChange }) {
  const { t, u } = useLang();
  return (
    <View style={{ gap: 10, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Tap key={n} onPress={() => onChange(n)} face="transparent" edge="transparent" depth={0} accessibilityLabel={`${n}`} selected={value >= n}>
            <Ico icon={Star} motion="pop" size={40} box={56} colors={['transparent', value >= n ? C.saffron : '#efe2d0', value >= n ? C.saffronDeep : C.ink3]} />
          </Tap>
        ))}
      </View>
      {value > 0 ? <Say main={t(`star${value}`)} ur={u(`star${value}`)} size={18} weight="heavy" align="center" /> : <L k="tapStar" size={16} color={C.ink3} align="center" />}
    </View>
  );
}

// ---------- countdown ring (time left to answer a request) ----------
export function Ring({ fraction = 1, size = 64, stroke = 7, label, sub, color = C.henna }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#ecd9b8" strokeWidth={stroke} fill={C.card} />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - Math.max(0, Math.min(1, fraction)))} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontFamily: F.heavy, fontSize: size * 0.27, lineHeight: size * 0.32, color: C.ink }}>{label}</Text>
      {!!sub && <Text style={{ fontFamily: F.bold, fontSize: size * 0.16, lineHeight: size * 0.2, color: C.ink2 }}>{sub}</Text>}
    </View>
  );
}

// ---------- on / off switch ----------
export function Toggle({ on }) {
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => { Animated.timing(x, { toValue: on ? 1 : 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: false }).start(); }, [on, x]);
  return (
    <Animated.View style={{ width: 84, height: 46, borderRadius: 23, padding: 4, backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: ['#6f2a1b', C.leaf] }) }}>
      <Animated.View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 38] }) }] }} />
    </Animated.View>
  );
}

// ---------- loading & errors ----------
export function Loading() {
  const { t } = useLang();
  return (
    <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
      <ActivityIndicator size="large" color={C.henna} />
      <P color={C.ink3}>{t('loading')}</P>
    </View>
  );
}

export function ErrorBox({ error, onRetry }) {
  const l = useLang();
  if (!error) return null;
  return (
    <Box tone="chilli">
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Warning size={26} weight="duotone" color={C.chilliDeep} duotoneColor="#f19aa1" duotoneOpacity={1} />
        <P color={C.chilliDeep} weight="bold" style={{ flex: 1 }}>{typeof error === 'string' ? error : errorText(error, l)}</P>
      </View>
      {onRetry && <LinkBtn k="tryAgain" color={C.chilliDeep} onPress={onRetry} />}
    </Box>
  );
}

// Rises into place when a screen opens (cards, list rows), one after another.
export function RiseIn({ i = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 320, delay: i * 60, easing: Easing.out(Easing.ease), useNativeDriver: native }).start();
  }, [i, v]);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }, style]}>{children}</Animated.View>;
}

export const row = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  center: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
