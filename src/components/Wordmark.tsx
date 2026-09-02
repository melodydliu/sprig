import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

/** A small sprig glyph + the "Forage" wordmark. */
export function Wordmark({ size = 34 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.34 }}>
      <Sprig size={size} color={theme.colors.primary} />
      <Text
        style={{
          fontFamily: theme.typography.display.fontFamily,
          fontSize: size * 0.95,
          lineHeight: size * 1.1,
          color: theme.colors.text,
          letterSpacing: 0.2,
        }}
      >
        Forage
      </Text>
    </View>
  );
}

export function Sprig({ size = 34, color = '#356B4B' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width="100%" height="100%" viewBox="0 0 32 32" fill="none">
        <Path d="M16 29V11" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M16 15c-1-4-4.5-6-8-6 0 4 3 7 8 7Z" fill={color} />
        <Path d="M16 12c1-4.5 4.5-7 8.5-7 0 4.5-3.5 8-8.5 8Z" fill={color} opacity={0.82} />
        <Path d="M16 20c-.8-3-3.4-4.6-6-4.6 0 3 2.2 5.2 6 5.2Z" fill={color} opacity={0.62} />
      </Svg>
    </View>
  );
}
