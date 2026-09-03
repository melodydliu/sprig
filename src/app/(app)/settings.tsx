import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { entryRepository } from '@/data';
import { useAuth } from '@/features/auth/authStore';
import { exportAllData } from '@/features/data-export/exportData';
import { useEntries } from '@/features/entries/entriesStore';
import { useSettings, type Units } from '@/features/settings/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const { all, resetToSampleData } = useEntries();
  const { units, setUnits, hydrate } = useSettings();

  const [busy, setBusy] = useState<null | 'reset' | 'export' | 'sync'>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const entryCount = all.filter((e) => !e.deletedAt).length;
  const pendingCount = all.filter((e) => e.syncStatus === 'pending' && !e.deletedAt).length;

  const doSync = async () => {
    setBusy('sync');
    try {
      // Mock: entryRepository.sync() marks everything synced.
      await entryRepository.sync();
      await useEntries.getState().load({ force: true });
      toast.show('Synced', 'success');
    } finally {
      setBusy(null);
    }
  };

  const doExport = async () => {
    setBusy('export');
    try {
      const res = await exportAllData();
      if (res.ok) toast.show(`Exported ${res.count} finds`, 'success');
    } finally {
      setBusy(null);
    }
  };

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
      'Delete account',
      'Account deletion needs the cloud backend, which is not wired up in this build. For now, "Sign out" and "Reset to sample data" cover local testing.',
      [{ text: 'OK' }],
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
        <Divider />
        <Row label="Name" value={user?.profile.displayName ?? '—'} />
        <Divider />
        <TapRow label="Sign out" tone="danger" onPress={signOut} />
      </Section>

      <Section title="Sync">
        <Row
          label="Status"
          value={pendingCount > 0 ? `${pendingCount} waiting to sync` : 'All synced (local)'}
        />
        <Divider />
        <TapRow
          label={busy === 'sync' ? 'Syncing…' : 'Sync now'}
          onPress={doSync}
          disabled={busy != null}
        />
        <Text variant="caption" color="textMuted" style={styles.note}>
          Cloud backup is stubbed in this build — “Sync now” just clears the local queue.
        </Text>
      </Section>

      <Section title="Units">
        <View style={styles.segmentRow}>
          {(['mi', 'km'] as Units[]).map((u) => {
            const active = units === u;
            return (
              <Pressable
                key={u}
                onPress={() => setUnits(u)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  variant="label"
                  style={{ color: active ? theme.colors.onPrimary : theme.colors.textSecondary }}
                >
                  {u === 'mi' ? 'Miles' : 'Kilometres'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Data">
        <TapRow
          label={busy === 'export' ? 'Preparing…' : `Export all data (${entryCount} finds)`}
          onPress={doExport}
          disabled={busy != null}
        />
        <Divider />
        <TapRow label="Delete account" tone="danger" onPress={confirmDeleteAccount} />
      </Section>

      <Section title="Developer">
        <TapRow
          label={busy === 'reset' ? 'Resetting…' : 'Reset to sample data'}
          onPress={confirmReset}
          disabled={busy != null}
        />
      </Section>

      <Section title="About">
        <Row label="App" value="Forage" />
        <Divider />
        <Row label="Version" value={`${Constants.expoConfig?.version ?? '1.0.0'} · MVP`} />
      </Section>

      <View style={{ height: 40 }} />
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
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
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
  note: { paddingHorizontal: 4, marginTop: 8 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
