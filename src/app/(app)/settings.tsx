import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/authStore';
import { useEntries } from '@/features/entries/entriesStore';
import { useSettings, type Units } from '@/features/settings/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const { resetToSampleData } = useEntries();
  const { units, setUnits, hydrate } = useSettings();

  const [busy, setBusy] = useState<null | 'reset' | 'delete'>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

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
            setBusy('reset');
            try {
              await resetToSampleData();
              toast.show('Sample data restored', 'success');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes every find, photo, and note in your Sprigbook account — on this device and in the cloud. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setBusy('delete');
            try {
              const ok = await deleteAccount();
              if (ok) toast.show('Account deleted', 'success');
              else Alert.alert('Could not delete account', 'Check your connection and try again.');
            } finally {
              setBusy(null);
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
        <Row label="Email" value={user?.email ?? '—'} />
        <Divider />
        <TapRow label="Change password" onPress={() => router.push('/change-password')} />
        <Divider />
        <TapRow label="Sign out" tone="danger" onPress={signOut} />
      </Section>

      <Section title="Units" bare>
        <View style={styles.unitRow}>
          {(['mi', 'km'] as Units[]).map((u) => {
            const active = units === u;
            return (
              <Pressable
                key={u}
                onPress={() => setUnits(u)}
                style={({ pressed }) => [
                  styles.unitBtn,
                  {
                    backgroundColor: active ? theme.colors.primary : 'transparent',
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  variant="label"
                  style={{ color: active ? theme.colors.onPrimary : theme.colors.text }}
                >
                  {u === 'mi' ? 'Miles' : 'Kilometres'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {__DEV__ ? (
        <Section title="Developer">
          <TapRow
            label={busy === 'reset' ? 'Resetting…' : 'Reset to sample data'}
            onPress={confirmReset}
            disabled={busy != null}
          />
        </Section>
      ) : null}

      <Section title="About">
        <Row label="App" value="Sprigbook" />
        <Divider />
        <Row label="Version" value={`${Constants.expoConfig?.version ?? '1.0.0'} · MVP`} />
      </Section>

      <Pressable
        onPress={confirmDeleteAccount}
        disabled={busy != null}
        hitSlop={8}
        style={styles.deleteRow}
      >
        <Text variant="caption" color="danger" style={{ opacity: busy != null ? 0.4 : 0.75 }}>
          {busy === 'delete' ? 'Deleting…' : 'Delete account'}
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </Screen>
  );
}

function Section({
  title,
  children,
  bare = false,
}: {
  title: string;
  children: React.ReactNode;
  /** Skip the surface card wrapper and render children directly on the screen. */
  bare?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="label" color="textMuted" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      {bare ? (
        children
      ) : (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyMedium" numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function TapRow({
  label,
  onPress,
  tone = 'default',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.row}>
      <Text
        variant="bodyMedium"
        color={tone === 'danger' ? 'danger' : 'primary'}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />;
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
    gap: 12,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  unitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
  deleteRow: { alignItems: 'center', paddingVertical: 14, marginTop: 12 },
});
