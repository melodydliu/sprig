import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';
import { subDays, subMonths, subYears } from 'date-fns';
import { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useEntries } from '@/features/entries/entriesStore';
import { CATEGORY_ICONS } from '@/features/entries/components/CategoryChip';
import { useFilters } from '@/features/filters/filterStore';
import { countActiveFilters } from '@/features/filters/query';
import { useTheme } from '@/theme/ThemeProvider';
import { CATEGORIES, CATEGORY_LABELS, COLOR_NAMES, type ColorName } from '@/types/entry';

const COLOR_LABELS: Record<ColorName, string> = {
  white: 'White',
  cream: 'Cream',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  pink: 'Pink',
  purple: 'Purple',
  blue: 'Blue',
  green: 'Green',
  brown: 'Brown',
  black: 'Black',
  multi: 'Multi',
};

const DATE_PRESETS: { label: string; from: () => string | null }[] = [
  { label: 'Any time', from: () => null },
  { label: 'Past week', from: () => subDays(new Date(), 7).toISOString() },
  { label: 'Past month', from: () => subMonths(new Date(), 1).toISOString() },
  { label: 'Past 3 months', from: () => subMonths(new Date(), 3).toISOString() },
  { label: 'Past year', from: () => subYears(new Date(), 1).toISOString() },
];

const RADIUS_PRESETS = [null, 1, 5, 10, 25];

export const FilterSheet = forwardRef<BottomSheetModal>(function FilterSheet(_props, ref) {
  const theme = useTheme();
  const {
    filter,
    toggleCategory,
    toggleColor,
    toggleTag,
    toggleFavoritesOnly,
    setDateRange,
    setWithinMiles,
    clearFilter,
  } = useFilters();
  const entries = useEntries((s) => s.all);
  const activeCount = countActiveFilters(filter);

  // Distinct tags across all entries, most-used first.
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (e.deletedAt) continue;
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [entries]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    [],
  );

  const activeDateLabel = () => {
    if (!filter.dateFrom) return 'Any time';
    for (const p of DATE_PRESETS) {
      const f = p.from();
      if (f && Math.abs(new Date(f).getTime() - new Date(filter.dateFrom).getTime()) < 60_000) {
        return p.label;
      }
    }
    return null;
  };
  const currentDateLabel = activeDateLabel();

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['85%']}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
    >
      <View style={styles.headerRow}>
        <Text variant="title">Filter</Text>
        {activeCount > 0 ? (
          <TouchableOpacity onPress={clearFilter} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text variant="label" color="accent">
              Clear all
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Section title="Category">
          <View style={styles.wrap}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                Touchable={TouchableOpacity}
                label={CATEGORY_LABELS[c]}
                icon={CATEGORY_ICONS[c]}
                accent={theme.categoryColor(c).color}
                selected={filter.categories.includes(c)}
                onPress={() => toggleCategory(c)}
              />
            ))}
          </View>
        </Section>

        <Section title="Color">
          <View style={styles.wrap}>
            {COLOR_NAMES.map((c) => (
              <Chip
                key={c}
                Touchable={TouchableOpacity}
                label={COLOR_LABELS[c]}
                swatch={theme.swatch(c)}
                selected={filter.colors.includes(c)}
                onPress={() => toggleColor(c)}
              />
            ))}
          </View>
        </Section>

        {availableTags.length > 0 ? (
          <Section title="Tags">
            <View style={styles.wrap}>
              {availableTags.map((t) => (
                <Chip
                  key={t}
                  Touchable={TouchableOpacity}
                  label={`#${t}`}
                  selected={filter.tags.includes(t)}
                  onPress={() => toggleTag(t)}
                />
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Favorites">
          <View style={styles.wrap}>
            <Chip
              Touchable={TouchableOpacity}
              label="Favorites only"
              accent={theme.colors.favorite}
              selected={filter.favoritesOnly}
              onPress={toggleFavoritesOnly}
            />
          </View>
        </Section>

        <Section title="When">
          <View style={styles.wrap}>
            {DATE_PRESETS.map((p) => (
              <Chip
                key={p.label}
                Touchable={TouchableOpacity}
                label={p.label}
                selected={currentDateLabel === p.label}
                onPress={() => setDateRange(p.from(), null)}
              />
            ))}
          </View>
        </Section>

        <Section title="Within">
          <View style={styles.wrap}>
            {RADIUS_PRESETS.map((r) => (
              <Chip
                key={String(r)}
                Touchable={TouchableOpacity}
                label={r == null ? 'Any distance' : `${r} mi`}
                selected={filter.withinMiles === r}
                onPress={() => setWithinMiles(r)}
              />
            ))}
          </View>
        </Section>

        <View style={{ height: 24 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  section: { marginTop: 18, gap: 10 },
  sectionTitle: { letterSpacing: 0.6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
