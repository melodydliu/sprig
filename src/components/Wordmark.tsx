import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

const MARK = require('@/assets/images/sprig-mark.png');
// Source asset is 566x600 — used to keep the glyph's own proportions instead
// of squashing it into a square box.
const MARK_ASPECT = 566 / 600;

/** The Sprig mark + wordmark. */
export function Wordmark({ size = 34 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.34 }}>
      <Sprig size={size} />
      <Text
        style={{
          fontFamily: theme.typography.display.fontFamily,
          fontSize: size * 0.95,
          lineHeight: size * 1.1,
          color: theme.colors.text,
          letterSpacing: 0.2,
        }}
      >
        Sprig
      </Text>
    </View>
  );
}

/** The Sprig mark on its own — same app icon artwork, transparent background. */
export function Sprig({ size = 34 }: { size?: number }) {
  return (
    <View style={{ width: size * MARK_ASPECT, height: size }}>
      <Image source={MARK} style={{ width: '100%', height: '100%' }} contentFit="contain" />
    </View>
  );
}
