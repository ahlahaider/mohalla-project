// The worker app's root. It keeps three things in state:
//   user   - who is logged in (null = show login)
//   lang   - 'en' or 'roman-ur'
//   stack  - which screen is showing, as a simple list we push/pop
// A tiny hand-made "stack" is enough for 4 screens. If the app grows,
// switch to Expo Router (Expo's recommended navigation).
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api, tokenStore } from './src/api';
import { makeT } from './src/strings';
import { C } from './src/ui';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import JobScreen from './src/screens/JobScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [lang, setLang] = useState('roman-ur'); // workers default to Roman Urdu
  const [stack, setStack] = useState([{ name: 'home' }]);
  const [authScreen, setAuthScreen] = useState('login');

  // On start, reuse a saved login if there is one.
  useEffect(() => {
    api('/auth/me')
      .then(({ user }) => user.role === 'worker' && setUser(user))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const signedIn = async ({ token, user }) => {
    if (user.role !== 'worker') throw new Error('This app is for workers. Customers use the website.');
    await tokenStore.set(token);
    setUser(user);
    if (user.language) setLang(user.language);
  };

  const nav = {
    push: (name, params) => setStack((st) => [...st, { name, params }]),
    back: () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)),
    logout: async () => { await tokenStore.clear(); setUser(null); setStack([{ name: 'home' }]); },
  };
  const i18n = { ...makeT(lang), lang, toggleLang: () => setLang((l) => (l === 'en' ? 'roman-ur' : 'en')) };
  const props = { nav, i18n, user, setUser };

  const top = stack[stack.length - 1];
  let screen = null;
  if (checking) screen = null;
  else if (!user && authScreen === 'login') screen = <LoginScreen {...props} onDone={signedIn} goRegister={() => setAuthScreen('register')} />;
  else if (!user) screen = <RegisterScreen {...props} onDone={signedIn} goLogin={() => setAuthScreen('login')} />;
  else if (top.name === 'job') screen = <JobScreen {...props} jobId={top.params.id} />;
  else screen = <HomeScreen {...props} />;

  return (
    // SafeAreaView keeps content clear of the notch and the status bar.
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{screen}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
