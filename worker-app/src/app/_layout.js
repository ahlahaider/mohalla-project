// The root of the worker app (Expo Router: every file in src/app is a screen).
// Loads the fonts, keeps the language and the logged-in worker, and sends
// people who aren't logged in to the welcome screen.
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Baloo2_500Medium, Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { NotoNaskhArabic_500Medium, NotoNaskhArabic_600SemiBold } from '@expo-google-fonts/noto-naskh-arabic';
import { LangProvider } from '../lib/i18n';
import { AuthProvider, useAuth } from '../lib/auth';
import { C } from '../ui/theme';

// Screens anyone can open without logging in.
const PUBLIC = ['welcome', 'login', 'signup'];

function Gate() {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const first = segments[0];

  useEffect(() => {
    if (!ready) return;
    const onPublic = PUBLIC.includes(first);
    if (!user && !onPublic) router.replace('/welcome'); // includes the splash at "/"
    if (user && (!first || onPublic)) router.replace('/home');
  }, [user, ready, first]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper }, animation: 'slide_from_right' }}>
      <Stack.Screen name="home" options={{ animation: 'fade' }} />
      <Stack.Screen name="earnings" options={{ animation: 'fade' }} />
      <Stack.Screen name="help" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Baloo2_500Medium, Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold,
    NotoNaskhArabic_500Medium, NotoNaskhArabic_600SemiBold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.henna }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LangProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
