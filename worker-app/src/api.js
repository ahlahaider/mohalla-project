// Talks to the Mohalla API. Same idea as the web app's api.js, but the login
// token is kept in the phone's secure storage instead of the browser.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// On a phone, "localhost" means the phone itself, not your laptop. Set
// EXPO_PUBLIC_API_URL to your laptop's Wi-Fi address (see the README), e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api npx expo start
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// SecureStore only exists on phones; the web preview falls back to localStorage.
export const tokenStore = {
  get: () => (Platform.OS === 'web' ? Promise.resolve(localStorage.getItem('token')) : SecureStore.getItemAsync('token')),
  set: (t) => (Platform.OS === 'web' ? Promise.resolve(localStorage.setItem('token', t)) : SecureStore.setItemAsync('token', t)),
  clear: () => (Platform.OS === 'web' ? Promise.resolve(localStorage.removeItem('token')) : SecureStore.deleteItemAsync('token')),
};

export async function api(path, { method = 'GET', body } = {}) {
  const token = await tokenStore.get();
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error(`Can't reach the server at ${API_URL}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const rupees = (n) => (n == null ? '—' : `Rs ${Number(n).toLocaleString('en-PK')}`);
