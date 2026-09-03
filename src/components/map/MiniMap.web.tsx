import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { GeoPoint } from '@/types/entry';

interface Props {
  point: GeoPoint;
  height?: number;
  span?: number;
  style?: StyleProp<ViewStyle>;
  rounded?: boolean;
}

/** Web fallback — react-native-maps has no web support. */
export function MiniMap({ point, height = 150, style, rounded = true }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          height,
          backgroundColor: theme.colors.backgroundAlt,
          borderRadius: rounded ? theme.radius.md : 0,
          borderWidth: rounded ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <MapPin size={20} color={theme.colors.textMuted} />
      <Text variant="caption" color="textMuted">
        Map available on device
      </Text>
      <Text variant="caption" color="textMuted">
        {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
      </Text>
    </View>
  );
}

export function Pin() {
  return null;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden' },
});
