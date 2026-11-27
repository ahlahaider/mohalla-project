// Talks to the Mohalla API. Same idea as the website's api.js, but the login
// token is kept in the phone's secure storage instead of the browser.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// On a phone, "localhost" means the phone itself, not your laptop. Set
// EXPO_PUBLIC_API_URL to your laptop's Wi-Fi address (see the README), e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api npx expo start
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const ORIGIN = API_URL.replace(/\/api$/, '');

// SecureStore only exists on phones; the web preview falls back to localStorage.
const web = Platform.OS === 'web';
export const store = {
  get: async (k) => { try { return web ? localStorage.getItem(k) : await SecureStore.getItemAsync(k); } catch { return null; } },
  set: async (k, v) => { try { if (web) localStorage.setItem(k, v); else await SecureStore.setItemAsync(k, v); } catch { /* ignore */ } },
  remove: async (k) => { try { if (web) localStorage.removeItem(k); else await SecureStore.deleteItemAsync(k); } catch { /* ignore */ } },
};

// Errors carry the API's `code` (e.g. 'pin_wrong') so screens can show the message in the user's language.
export async function api(path, { method = 'GET', body } = {}) {
  const token = await store.get('token');
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
  } catch {
    const err = new Error(`Can't reach the server at ${API_URL}`);
    err.code = 'offline';
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    Object.assign(err, { status: res.status, code: data.code, data });
    throw err;
  }
  return data;
}

// Turns an API error into words in the user's language, using err_<code> strings when we have them.
export function errorText(err, { t, has }) {
  if (!err) return '';
  if (err.code === 'offline') return t('noInternet');
  const key = `err_${err.code}`;
  if (err.code && has(key)) return t(key, { n: err.data?.triesLeft ?? err.data?.minutes ?? err.data?.seconds });
  return err.message || t('somethingWentWrong');
}

// Photos are saved as "/api/photos/<key>"; the phone needs the full address.
export const photoUri = (url) => (url && url.startsWith('/') ? ORIGIN + url : url);

export const rupees = (n) => (n == null ? '—' : `Rs ${Number(n).toLocaleString('en-PK')}`);

export const prettyPhone = (p = '') => (p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4)}` : p);

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name;

export const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
