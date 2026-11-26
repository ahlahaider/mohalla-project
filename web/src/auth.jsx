// Keeps track of who is logged in and shares it with every page through
// React context, so any component can call useAuth() to get the user.
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, if a token is saved, ask the API who it belongs to.
  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const finish = ({ token, user }) => {
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const value = {
    user,
    loading,
    login: (phone, password) => api('/auth/login', { method: 'POST', body: { phone, password } }).then(finish),
    register: (fields) => api('/auth/register', { method: 'POST', body: fields }).then(finish),
    logout: () => {
      localStorage.removeItem('token');
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
