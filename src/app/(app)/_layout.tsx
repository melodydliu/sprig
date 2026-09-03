import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="capture"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen name="entry/[id]" />
      <Stack.Screen name="entry/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="location" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
    </Stack>
  );
}
