import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import type { ColorName } from '@/types/entry';

interface Props {
  colors: ColorName[];
  size?: number;
  max?: number;
}

export function ColorDots({ colors, size = 12, max = 5 }: Props) {
  const theme = useTheme();
  if (colors.length === 0) return null;
  const shown = colors.slice(0, max);

  return (
    <View style={styles.row}>
      {shown.map((name, i) => {
        const border = { borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth * 2 };
        if (name === 'multi') {
          return (
            <Svg key={`${name}-${i}`} width={size} height={size} style={styles.dot}>
              <Defs>
                <LinearGradient id={`m${i}`} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#E7C24C" />
                  <Stop offset="0.5" stopColor="#D580A2" />
                  <Stop offset="1" stopColor="#5C8C4D" />
                </LinearGradient>
              </Defs>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 0.75}
                fill={`url(#m${i})`}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
            </Svg>
          );
        }
        return (
          <View
            key={`${name}-${i}`}
            style={[
              styles.dot,
              border,
              { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.swatch(name) },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { marginRight: -3 },
});
