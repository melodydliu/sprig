import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpDown, List, Map as MapIcon, Plus, Settings, SlidersHorizontal } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Sprig } from '@/components/Wordmark';
import { EntryCard } from '@/features/entries/components/EntryCard';
import { useEntries } from '@/features/entries/entriesStore';
import { FilterChips } from '@/features/filters/FilterChips';
import { FilterSheet } from '@/features/filters/FilterSheet';
import { useFilters } from '@/features/filters/filterStore';
import { countActiveFilters, runQuery } from '@/features/filters/query';
import { SearchBar } from '@/features/filters/SearchBar';
import { SortSheet } from '@/features/filters/SortSheet';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { JournalMap } from '@/features/map/JournalMap';
import { useSettings } from '@/features/settings/settingsStore';
import { syncEngine } from '@/features/sync';
import { SyncStatusBar } from '@/features/sync/components/SyncStatusBar';
import { useTheme } from '@/theme/ThemeProvider';

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { all, loading, refreshing, loaded, load } = useEntries();
  const { search, filter, sort, viewMode, setViewMode } = useFilters();
  const { point: origin } = useCurrentLocation();
  const units = useSettings((s) => s.units);

  const filterSheet = useRef<BottomSheetModal>(null);
  const sortSheet = useRef<BottomSheetModal>(null);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () => runQuery(all, { search, filter, sort, origin }),
    [all, search, filter, sort, origin],
  );
  const activeFilters = countActiveFilters(filter);
  const totalVisible = all.filter((e) => !e.deletedAt).length;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sprig size={24} color={theme.colors.primary} />
          <Text variant="display">Journal</Text>
        </View>
        <View style={styles.headerRight}>
          <Toggle viewMode={viewMode} onChange={setViewMode} />
          <Link href="/settings" asChild>
            <Pressable hitSlop={8} accessibilityLabel="Settings">
              <Settings size={21} color={theme.colors.textSecondary} strokeWidth={2.2} />
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.controls}>
        <SearchBar />
        <IconBtn
          icon={SlidersHorizontal}
          badge={activeFilters}
          onPress={() => filterSheet.current?.present()}
        />
        <IconBtn icon={ArrowUpDown} onPress={() => sortSheet.current?.present()} />
      </View>

      <FilterChips />

      <SyncStatusBar />

      {viewMode === 'map' ? (
        <JournalMap entries={visible} />
      ) : loaded && visible.length === 0 ? (
        <EmptyState hasEntries={totalVisible > 0} />
      ) : (
        <FlashList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard entry={item} origin={origin} unit={units} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xs,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void syncEngine.syncNow();
                return load({ refreshing: true });
              }}
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

      <FilterSheet ref={filterSheet} />
      <SortSheet ref={sortSheet} />
    </Screen>
  );
}

function Toggle({
  viewMode,
  onChange,
}: {
  viewMode: 'list' | 'map';
  onChange: (m: 'list' | 'map') => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.toggle,
        { backgroundColor: theme.colors.backgroundAlt, borderRadius: theme.radius.pill },
      ]}
    >
      {(['list', 'map'] as const).map((m) => {
        const active = viewMode === m;
        const Icon = m === 'list' ? List : MapIcon;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[
              styles.toggleItem,
              active && { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill },
            ]}
          >
            <Icon
              size={16}
              color={active ? theme.colors.primary : theme.colors.textMuted}
              strokeWidth={2.4}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function IconBtn({
  icon: Icon,
  onPress,
  badge,
}: {
  icon: typeof List;
  onPress: () => void;
  badge?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.iconBtn,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Icon size={19} color={theme.colors.textSecondary} strokeWidth={2.3} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
          <Text variant="caption" style={{ color: '#fff', fontSize: 10 }}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function EmptyState({ hasEntries }: { hasEntries: boolean }) {
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
        {hasEntries ? 'Nothing matches' : 'Spot something?'}
      </Text>
      <Text variant="body" color="textSecondary" center style={{ maxWidth: 260 }}>
        {hasEntries
          ? 'Try clearing a filter or search term.'
          : 'Tap the + to add your first find — a photo and where you saw it is all you need.'}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggle: { flexDirection: 'row', padding: 3, gap: 2 },
  toggleItem: { paddingHorizontal: 10, paddingVertical: 6 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
