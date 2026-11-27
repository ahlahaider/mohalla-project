// Keeps track of who is logged in and shares it with every page through
// React context, so any component can call useAuth() to get the user.
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, if a token is saved, ask the API who it belongs to.
  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Every successful login/sign-up answer looks like { token, user }.
  const startSession = ({ token, user: u }) => {
    setToken(token);
    setUser(u);
    return u;
  };

  const post = (path, body) => api(path, { method: 'POST', body });

  const value = {
    user,
    loading,
    // customers: number + 4-digit PIN
    loginWithPin: (phone, pin) => post('/auth/login', { phone, pin, app: 'customer' }).then(startSession),
    // admin (and workers on the web): number + password
    loginWithPassword: (phone, password) => post('/auth/login', { phone, password }).then(startSession),
    // after a sign-up code was checked: name + PIN creates the account
    register: ({ ticket, name, pin, area, language }) =>
      post('/auth/register', { role: 'customer', ticket, name, pin, area: area || undefined, language }).then(startSession),
    // after a "forgot PIN" code was checked
    resetPin: ({ ticket, pin }) => post('/auth/pin/reset', { ticket, pin, app: 'customer' }).then(startSession),
    // after saving settings: merge the new details into the logged-in user
    updateUser: (changes) => setUser((u) => ({ ...u, ...changes })),
    logout: () => {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
