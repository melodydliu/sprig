import { Stack } from 'expo-router';

export default function CaptureLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" options={{ contentStyle: { backgroundColor: 'transparent' } }} />
      <Stack.Screen name="location" />
    </Stack>
  );
}
