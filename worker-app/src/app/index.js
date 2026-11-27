// The first screen: a henna splash while we check for a saved login.
// The root layout then sends the worker to /home or /welcome.
import { View, Text } from 'react-native';
import { C, F } from '../ui/theme';

export default function Start() {
  return (
    <View style={{ flex: 1, backgroundColor: C.henna, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 44, color: C.cream }}>mohalla</Text>
      <Text style={{ fontFamily: F.urdu, fontSize: 22, color: C.creamUr }}>محلہ</Text>
    </View>
  );
}
