import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { CATEGORY_ICONS } from '@/features/entries/components/CategoryChip';
import { useTheme } from '@/theme/ThemeProvider';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@/types/entry';

interface Props {
  value: Category;
  onChange: (category: Category) => void;
}

export function CategoryPicker({ value, onChange }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat}
          label={CATEGORY_LABELS[cat]}
          icon={CATEGORY_ICONS[cat]}
          accent={theme.categoryColor(cat).color}
          selected={value === cat}
          onPress={() => onChange(cat)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
