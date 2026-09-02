import { FlashList } from '@shopify/flash-list';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Settings2 } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Sprig } from '@/components/Wordmark';
import { EntryCard } from '@/features/entries/components/EntryCard';
import { useEntries } from '@/features/entries/entriesStore';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { useTheme } from '@/theme/ThemeProvider';

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { all, loading, refreshing, loaded, load } = useEntries();
  const { point: origin } = useCurrentLocation();

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = all.filter((e) => !e.deletedAt);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sprig size={26} color={theme.colors.primary} />
          <Text variant="display">Journal</Text>
        </View>
        <Link href="/settings" asChild>
          <Pressable hitSlop={10} accessibilityLabel="Settings">
            <Settings2 size={22} color={theme.colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        </Link>
      </View>

      {loaded && visible.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard entry={item} origin={origin} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ refreshing: true })}
              tintColor={theme.colors.textMuted}
            />
          }
          ListEmptyComponent={
            loading ? (
              <Text variant="body" color="textMuted" center style={{ marginTop: 40 }}>
                Loading your finds…
              </Text>
            ) : null
          }
        />
      )}

      <Pressable
        accessibilityLabel="Add a find"
        onPress={() => router.push('/capture')}
        style={({ pressed }) => [
          styles.fab,
          theme.elevation(3),
          {
            bottom: insets.bottom + 24,
            backgroundColor: theme.colors.primary,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Plus size={28} color={theme.colors.onPrimary} strokeWidth={2.6} />
      </Pressable>
    </Screen>
  );
}

function EmptyState() {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emptyBadge,
          { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.xl },
        ]}
      >
        <Sprig size={54} color={theme.colors.primary} />
      </View>
      <Text variant="title" center>
        Spot something?
      </Text>
      <Text variant="body" color="textSecondary" center style={{ maxWidth: 260 }}>
        Tap the + to add your first find — a photo and where you saw it is all you need.
      </Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyBadge: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 22,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
