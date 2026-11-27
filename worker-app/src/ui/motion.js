// Icons that move, like on the customer website:
//   - once when the screen opens (`play` prop, one after another with `i`)
//   - again every time the button/tile they sit in is pressed, or hovered in the web preview
//   - the hourglass keeps turning while something is waiting (`loop`)
// Each service has its own movement: the wrench wiggles, the lightning flashes, the broom sweeps…
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, View, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TONES } from './theme';

const native = Platform.OS !== 'web';

// [progress, value] keyframes, the same numbers as the mo-* animations in web/src/ui/app.css.
const MOTIONS = {
  wiggle: { ms: 700, rotate: [[0, 0], [0.25, -14], [0.6, 10], [1, 0]] },
  flash: { ms: 700, scale: [[0, 1], [0.3, 1.18], [1, 1]], opacity: [[0, 1], [0.3, 1], [0.45, 0.55], [0.6, 1], [1, 1]] },
  sweep: { ms: 800, rotate: [[0, 0], [0.3, -12], [0.65, 9], [1, 0]], x: [[0, 0], [0.3, -3], [0.65, 3], [1, 0]] },
  knock: { ms: 550, rotate: [[0, 0], [0.35, -24], [0.55, 6], [1, 0]], origin: '20% 80%' },
  roll: { ms: 700, y: [[0, 0], [0.35, -5], [0.7, 3], [1, 0]] },
  drive: { ms: 700, x: [[0, 0], [0.3, 4], [0.6, -2], [1, 0]], y: [[0, 0], [0.3, -1], [0.6, 0], [1, 0]] },
  crawl: { ms: 900, x: [[0, 0], [0.25, 2], [0.5, -1], [0.75, -2], [1, 0]], y: [[0, 0], [0.25, -2], [0.5, -3], [0.75, 0], [1, 0]], rotate: [[0, 0], [0.25, 8], [0.5, -6], [0.75, 4], [1, 0]] },
  spin: { ms: 900, rotate: [[0, 0], [1, 180]], origin: '50% 50%' },
  ring: { ms: 1000, rotate: [[0, 0], [0.1, -14], [0.2, 14], [0.3, -14], [0.4, 14], [0.5, 0], [1, 0]] },
  pop: { ms: 450, scale: [[0, 0.4], [0.7, 1.12], [1, 1]] },
  hourglass: { ms: 2400, rotate: [[0, 0], [0.4, 0], [0.5, 180], [0.9, 180], [1, 360]], origin: '50% 50%' },
};

const lerp = (v, frames, unit = '') => v.interpolate({
  inputRange: frames.map((f) => f[0]),
  outputRange: frames.map((f) => (unit ? `${f[1]}${unit}` : f[1])),
});

// ---------- the "something was pressed/hovered" signal ----------
// A Tap tells every icon inside it to play its movement.
const PlayContext = createContext(null);

function usePlaySignal() {
  const listeners = useRef(new Set());
  return useMemo(() => ({
    subscribe: (fn) => { listeners.current.add(fn); return () => listeners.current.delete(fn); },
    fire: () => listeners.current.forEach((fn) => fn()),
  }), []);
}

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduceMotion = Boolean(v); }).catch(() => {});

// ---------- Ico: a two-tone icon on a soft coloured square ----------
// icon: a Phosphor icon component. tone: colour family (see TONES). motion: one of MOTIONS.
export function Ico({ icon: Icon, tone = 'ink', size = 26, box, motion, play = false, i = 0, loop = false, round = false, colors, style }) {
  const s = box ?? Math.round(size * 1.65);
  const [bg, fill, ink] = colors || TONES[tone] || TONES.ink;
  // Rests at the END of its movement (1), so icons sit at their normal size between plays.
  const v = useRef(new Animated.Value(1)).current;
  const m = MOTIONS[motion];
  const signal = useContext(PlayContext);

  const run = useCallback((delay = 0) => {
    if (!m || reduceMotion) return;
    v.stopAnimation();
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: m.ms, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: native }).start();
  }, [m, v]);

  useEffect(() => {
    if (!m || reduceMotion) return undefined;
    if (loop) {
      v.setValue(0);
      const anim = Animated.loop(Animated.timing(v, { toValue: 1, duration: m.ms, easing: Easing.inOut(Easing.ease), useNativeDriver: native }));
      anim.start();
      return () => anim.stop();
    }
    if (play) run(250 + i * 120);
    return undefined;
  }, [loop, play, i, m, run, v]);

  useEffect(() => (signal && !loop ? signal.subscribe(() => run(0)) : undefined), [signal, loop, run]);

  const transform = [];
  if (m?.x) transform.push({ translateX: lerp(v, m.x) });
  if (m?.y) transform.push({ translateY: lerp(v, m.y) });
  if (m?.rotate) transform.push({ rotate: lerp(v, m.rotate, 'deg') });
  if (m?.scale) transform.push({ scale: lerp(v, m.scale) });

  return (
    <View
      style={[{ width: s, height: s, borderRadius: round ? s / 2 : s * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={{ transform, opacity: m?.opacity ? lerp(v, m.opacity) : 1, transformOrigin: m?.origin || '50% 60%' }}>
        <Icon size={size} weight="duotone" color={ink} duotoneColor={fill} duotoneOpacity={1} />
      </Animated.View>
    </View>
  );
}

// ---------- Tap: anything pressable ----------
// Looks "pushable": a solid face on a darker edge. Pressing pushes the face down
// onto the edge (like the website's buttons) and makes the icons inside dance.
//   face: background colour, edge: the darker strip under it, border: optional outline colour
export function Tap({ onPress, disabled, face, edge, border, radius = 16, depth = 4, style, faceStyle, children, haptic = true, accessibilityLabel, accessibilityRole = 'button', selected }) {
  const signal = usePlaySignal();
  const fire = () => { if (!disabled) signal.fire(); };
  return (
    <PlayContext.Provider value={signal}>
      <Pressable
        onPress={(e) => {
          if (haptic && native) Haptics.selectionAsync().catch(() => {});
          onPress?.(e);
        }}
        onPressIn={fire}
        onHoverIn={fire}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: Boolean(disabled), selected }}
        style={style}
      >
        {({ pressed, hovered }) => {
          const down = pressed && !disabled;
          return (
            <View
              style={[{
                backgroundColor: face,
                borderRadius: radius,
                borderColor: border || edge,
                borderWidth: border ? 2 : 0,
                borderBottomColor: edge,
                borderBottomWidth: (border ? 2 : 0) + (down ? 1 : depth),
                marginTop: down ? depth - 1 : 0,
                opacity: hovered && !disabled && !down ? 0.96 : 1,
              }, faceStyle]}
            >
              {children}
            </View>
          );
        }}
      </Pressable>
    </PlayContext.Provider>
  );
}

// Lets a screen make icons in a non-pressable area dance together (e.g. a card's header).
export function usePlayGroup() {
  return usePlaySignal();
}
export const PlayGroup = PlayContext.Provider;
