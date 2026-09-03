import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

import { syncEngine } from '../index';
import { useSync } from '../syncStore';

/**
 * Deliberately quiet strip under the Journal header. Nothing shows when sync is
 * idle and there's nothing pending — it only surfaces work or a problem.
 */
export function SyncStatusBar() {
  const theme = useTheme();
  const { status, pending, error } = useSync();

  if (status === 'disabled') return null;
  if (status === 'idle' && pending === 0) return null;

  const isError = status === 'error';
  const label = isError
    ? (error ?? 'Sync failed — tap to retry')
    : status === 'syncing'
      ? 'Syncing…'
      : `${pending} waiting to sync`;

  return (
    <Pressable
      onPress={() => void syncEngine.syncNow()}
      disabled={status === 'syncing'}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {status === 'syncing' ? (
        <ActivityIndicator size="small" color={theme.colors.textMuted} />
      ) : (
        <View
          style={[
            styles.dot,
            { backgroundColor: isError ? theme.colors.danger : theme.colors.textMuted },
          ]}
        />
      )}
      <Text variant="caption" color={isError ? 'danger' : 'textMuted'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
