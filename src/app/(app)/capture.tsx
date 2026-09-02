import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Camera } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

/** Placeholder — the real camera-first capture flow lands in Milestone 2. */
export default function CaptureScreen() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
          <Camera size={40} color={theme.colors.primary} strokeWidth={2} />
        </View>
        <Text variant="title" center>
          Capture
        </Text>
        <Text variant="body" color="textSecondary" center style={{ maxWidth: 260 }}>
          The camera-first capture flow is the next milestone.
        </Text>
        <Button label="Back to Journal" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
