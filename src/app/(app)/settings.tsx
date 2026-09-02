import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/authStore';
import { useEntries } from '@/features/entries/entriesStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const resetToSampleData = useEntries((s) => s.resetToSampleData);
  const [resetting, setResetting] = useState(false);

  const confirmReset = () => {
    Alert.alert(
      'Reset to sample data?',
      'This clears every find on this device and restores the original sample set.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetToSampleData();
              toast.show('Sample data restored', 'success');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2.4} />
        </Pressable>
        <Text variant="title">Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <Section title="Account">
        <Row label="Signed in as" value={user?.email ?? '—'} />
        <Row label="Name" value={user?.profile.displayName ?? '—'} />
        <Pressable onPress={signOut} style={styles.row}>
          <Text variant="bodyMedium" color="danger">
            Sign out
          </Text>
        </Pressable>
      </Section>

      <Section title="Sync">
        <Row label="Status" value="Local only (MVP)" />
        <Text variant="caption" color="textMuted" style={styles.note}>
          Cloud backup and multi-device sync arrive in a later milestone.
        </Text>
      </Section>

      <Section title="Developer">
        <Pressable onPress={confirmReset} disabled={resetting} style={styles.row}>
          <Text variant="bodyMedium" color={resetting ? 'textMuted' : 'primary'}>
            {resetting ? 'Resetting…' : 'Reset to sample data'}
          </Text>
        </Pressable>
      </Section>

      <Section title="About">
        <Row label="App" value="Forage" />
        <Row
          label="Version"
          value={`${Constants.expoConfig?.version ?? '1.0.0'} · MVP`}
        />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="label" color="textMuted" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { marginBottom: 8, marginLeft: 4, letterSpacing: 0.6 },
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  note: { paddingHorizontal: 4, marginTop: 8 },
});
