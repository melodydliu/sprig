import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Text } from '@/components/Text';
import type { SortKey } from '@/data/repositories';
import { useFilters } from '@/features/filters/filterStore';
import { useTheme } from '@/theme/ThemeProvider';

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'nearest', label: 'Nearest to me' },
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'recently_updated', label: 'Recently updated' },
];

export const SortSheet = forwardRef<BottomSheetModal>(function SortSheet(_props, ref) {
  const theme = useTheme();
  const sort = useFilters((s) => s.sort);
  const setSort = useFilters((s) => s.setSort);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
    >
      <BottomSheetView style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Sort by
        </Text>
        {OPTIONS.map((opt) => {
          const active = sort === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                setSort(opt.key);
                (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
              }}
              style={styles.row}
            >
              <Text variant="body" style={{ color: active ? theme.colors.primary : theme.colors.text }}>
                {opt.label}
              </Text>
              {active ? <Check size={18} color={theme.colors.primary} strokeWidth={2.6} /> : null}
            </Pressable>
          );
        })}
        <View style={{ height: 12 }} />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  title: { marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
