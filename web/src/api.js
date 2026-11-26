// Every call to the API goes through this one function, so the login token,
// JSON handling and error messages are dealt with in one place.
// In production, set VITE_API_URL to the deployed API (e.g. https://mohalla-api.onrender.com/api).
const BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken() {
  try { return localStorage.getItem('token'); } catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  } catch { /* private mode: login lasts until the tab closes */ }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
  } catch {
    // fetch itself fails only when there's no connection at all
    const err = new Error('No internet');
    err.code = 'offline';
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // The API sends { error: "...", code?: "...", ...extra }. Keep all of it,
    // so screens can show the message in the user's language (see errorText).
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    err.code = data.code;
    err.data = data;
    throw err;
  }
  return data;
}

// Turns an API error into words for the screen, in the chosen language.
export function errorText(err, { t, has }) {
  if (!err) return '';
  if (err.code === 'offline') return t('noInternet');
  const key = `err_${err.code}`;
  if (err.code && has(key)) return t(key, { n: err.data?.triesLeft ?? err.data?.minutes ?? err.data?.seconds });
  return err.message || t('somethingWentWrong');
}

export const rupees = (n) => (n == null ? '—' : `Rs ${Number(n).toLocaleString('en-PK')}`);

export const timeOf = (date) =>
  new Date(date).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' });

// "03001234567" -> "0300 1234567" (easier to read back)
export const prettyPhone = (p = '') => (p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4)}` : p);
