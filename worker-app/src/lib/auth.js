// Who is logged in. The token lives in the phone's secure storage, so the
// worker stays logged in (the API's tokens last 180 days) until they log out.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, store } from './api';
import { useLang } from './i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const { setLang } = useLang();

  const refresh = useCallback(async () => {
    const { user: me } = await api('/auth/me');
    if (me.role !== 'worker') throw new Error('not a worker');
    setUser(me);
    return me;
  }, []);

  // On start, reuse a saved login if there is one.
  useEffect(() => {
    (async () => {
      if (await store.get('token')) {
        try { await refresh(); } catch (err) { if (err.status === 401 || err.message === 'not a worker') await store.remove('token'); }
      }
      setReady(true);
    })();
  }, [refresh]);

  const value = useMemo(() => ({
    user,
    ready,
    setUser,
    refresh,
    signIn: async ({ token, user: me }) => {
      await store.set('token', token);
      setUser(me);
      if (me.language) setLang(me.language);
    },
    logout: async () => {
      await store.remove('token');
      setUser(null);
    },
  }), [user, ready, refresh, setLang]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
