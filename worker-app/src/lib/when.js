// Turning dates into words people read easily: "Today · Morning 9 – 12".

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// The customer picks a time slot; its start hour tells us which one.
export function slotKey(date) {
  const h = new Date(date).getHours();
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  return 'evening';
}

// Returns { day, dayU, slot, slotU } for a preferred time.
export function whenParts(date, { t, u, lang }) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  let day; let dayU = '';
  if (sameDay(d, now)) { day = t('today'); dayU = u('today'); }
  else if (sameDay(d, tomorrow)) { day = t('tomorrow'); dayU = u('tomorrow'); }
  else if (sameDay(d, yesterday)) { day = t('yesterday'); dayU = u('yesterday'); }
  else day = d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const s = slotKey(d);
  return { day, dayU, slot: t(s), slotU: u(s) };
}

export const whenText = (date, l) => {
  const p = whenParts(date, l);
  return p ? `${p.day} · ${p.slot}` : '';
};

// "3 h 20 min" left until a deadline (or null when it has passed).
export function timeLeft(until, { t, u }, now = Date.now()) {
  const ms = new Date(until).getTime() - now;
  if (!until || ms <= 0) return null;
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const key = !h ? 'mins' : m ? 'hoursMins' : 'hours';
  // text = main language, textU = Urdu script (so the Urdu line has no English in it)
  return { h, m, fraction: Math.min(1, ms / (4 * 3600e3)), text: t(key, { h, m }), textU: u(key, { h, m }) };
}

export const clock = (date) => new Date(date).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

export function shortDate(date, l) {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return l.t('today');
  if (sameDay(d, yesterday)) return l.t('yesterday');
  return d.toLocaleDateString('en-GB', { weekday: 'long' });
}
