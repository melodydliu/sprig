import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { LucideIcon } from 'lucide-react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Accent color for the selected state; defaults to the theme primary. */
  accent?: string;
  /** A small color swatch shown before the label (for the color picker). */
  swatch?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, icon: Icon, accent, swatch, style }: ChipProps) {
  const theme = useTheme();
  const tint = accent ?? theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? tint : theme.colors.surface,
          borderColor: selected ? tint : theme.colors.border,
          borderRadius: theme.radius.pill,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {swatch ? (
        <View
          style={[
            styles.swatch,
            {
              backgroundColor: swatch === 'multi' ? 'transparent' : swatch,
              borderColor: selected ? 'rgba(255,255,255,0.6)' : theme.colors.border,
            },
          ]}
        >
          {swatch === 'multi' ? <MultiSwatch /> : null}
        </View>
      ) : null}
      {Icon ? (
        <Icon
          size={14}
          strokeWidth={2.4}
          color={selected ? theme.colors.onPrimary : theme.colors.textSecondary}
        />
      ) : null}
      <Text
        variant="label"
        style={{ color: selected ? theme.colors.onPrimary : theme.colors.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MultiSwatch() {
  return (
    <View style={styles.multiWrap}>
      <View style={[styles.multiSlice, { backgroundColor: '#E7C24C' }]} />
      <View style={[styles.multiSlice, { backgroundColor: '#D580A2' }]} />
      <View style={[styles.multiSlice, { backgroundColor: '#5C8C4D' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  multiWrap: { flex: 1, flexDirection: 'row' },
  multiSlice: { flex: 1 },
});
