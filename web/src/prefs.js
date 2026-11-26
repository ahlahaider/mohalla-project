// Small things remembered on this phone (no account needed): the chosen area.
// Wrapped in try/catch because some browsers block storage in private mode.
import { useState } from 'react';

const AREA_KEY = 'mohalla.area';

function read(key) {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch { /* not remembered, still works */ }
}

export function useArea() {
  const [area, setAreaState] = useState(() => read(AREA_KEY));
  const setArea = (a) => {
    write(AREA_KEY, a);
    setAreaState(a);
  };
  return [area, setArea];
}

// Only allow going back to a page inside this app (never to another website).
export function safeReturnTo(value, fallback = '/') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

// "Rashid Electric Works" -> "Rashid". Used in "Ask Rashid to come".
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name;

// The team's help line. Leave empty until there is a real number.
export const HELP_PHONE = '';
