// Shared building blocks and colours for the worker app. Big touch targets,
// strong colours for yes/no, icons before words.
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const C = {
  terracotta: '#B4472A',
  marigold: '#F2B33D',
  green: '#2F6B4F',
  red: '#B3261E',
  cream: '#FFF3E2',
  card: '#FFFFFF',
  line: '#F1D9B8',
  ink: '#3A2117',
  muted: '#7A5A4A',
};

// A large, clearly coloured button. kind: 'primary' | 'go' | 'stop' | 'plain'
export function Btn({ title, icon, onPress, kind = 'plain', disabled, style }) {
  const bg = { primary: C.terracotta, go: C.green, stop: C.red, plain: C.card }[kind];
  const fg = kind === 'plain' ? C.ink : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}
    >
      {icon ? <Text style={[s.btnIcon, { color: fg }]}>{icon}</Text> : null}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={C.muted} {...props} />
    </View>
  );
}

// A tappable chip used for picking skills, areas, gender, etc.
export function Chip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: C.terracotta, borderColor: C.terracotta }]}>
      <Text style={[s.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export const T = ({ style, ...p }) => <Text style={[s.text, style]} {...p} />;
export const H = ({ style, ...p }) => <Text style={[s.h, style]} {...p} />;
export const Muted = ({ style, ...p }) => <Text style={[s.muted, style]} {...p} />;
export const ErrorText = ({ children }) => (children ? <Text style={s.error}>{children}</Text> : null);

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  pad: { padding: 16, paddingBottom: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  card: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: C.line },
  btnIcon: { fontSize: 22 },
  btnText: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600', color: C.ink, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderColor: C.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 50, fontSize: 18, color: C.ink },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff' },
  chipText: { fontSize: 15, fontWeight: '600', color: C.ink },
  text: { fontSize: 16, color: C.ink },
  h: { fontSize: 22, fontWeight: '700', color: C.ink, marginBottom: 6 },
  muted: { fontSize: 14, color: C.muted },
  error: { color: C.red, fontWeight: '700', fontSize: 15, marginVertical: 8 },
  big: { fontSize: 40 },
});
