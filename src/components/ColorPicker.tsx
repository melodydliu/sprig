import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme/ThemeProvider';
import { COLOR_NAMES, type ColorName } from '@/types/entry';

interface Props {
  value: ColorName[];
  onToggle: (color: ColorName) => void;
}

const LABELS: Record<ColorName, string> = {
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

export function ColorPicker({ value, onToggle }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {COLOR_NAMES.map((name) => (
        <Chip
          key={name}
          label={LABELS[name]}
          swatch={theme.swatch(name)}
          selected={value.includes(name)}
          onPress={() => onToggle(name)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
