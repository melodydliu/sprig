import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function CaptureLayout() {
  return (
    // This whole group is presented as a `fullScreenModal` (see (app)/_layout.tsx).
    // On iOS that's a separately-presented view-controller hierarchy, so the root
    // SafeAreaProvider (mounted once in the app's top-level layout) doesn't
    // propagate insets into it — useSafeAreaInsets()/SafeAreaView here would
    // otherwise measure 0 and let content sit under the status bar. Nesting a
    // fresh provider gives this modal its own, correctly-measured insets.
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="details" />
      </Stack>
    </SafeAreaProvider>
  );
}
