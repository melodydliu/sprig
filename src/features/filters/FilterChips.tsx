import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useFilters } from '@/features/filters/filterStore';
import { isFilterActive } from '@/features/filters/query';
import { useTheme } from '@/theme/ThemeProvider';
import { CATEGORY_LABELS } from '@/types/entry';

export function FilterChips() {
  const theme = useTheme();
  const {
    filter,
    toggleCategory,
    toggleColor,
    toggleTag,
    setDateRange,
    setWithinMiles,
  } = useFilters();

  if (!isFilterActive(filter)) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const c of filter.categories) {
    chips.push({ key: `cat-${c}`, label: CATEGORY_LABELS[c], onRemove: () => toggleCategory(c) });
  }
  for (const c of filter.colors) {
    chips.push({
      key: `col-${c}`,
      label: c[0].toUpperCase() + c.slice(1),
      onRemove: () => toggleColor(c),
    });
  }
  for (const t of filter.tags) {
    chips.push({ key: `tag-${t}`, label: `#${t}`, onRemove: () => toggleTag(t) });
  }
  if (filter.dateFrom) {
    chips.push({ key: 'date', label: 'Date range', onRemove: () => setDateRange(null, null) });
  }
  if (filter.withinMiles != null) {
    chips.push({
      key: 'radius',
      label: `${filter.withinMiles} mi`,
      onRemove: () => setWithinMiles(null),
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={chip.onRemove}
            style={[
              styles.chip,
              { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill },
            ]}
          >
            <Text variant="caption" style={{ color: theme.colors.onPrimarySoft }}>
              {chip.label}
            </Text>
            <X size={12} color={theme.colors.onPrimarySoft} strokeWidth={2.6} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10 },
  scroll: { flexGrow: 0 },
  row: { gap: 6, paddingHorizontal: 20, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
});
