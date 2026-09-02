import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { LucideIcon } from 'lucide-react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  haptic = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useMemo(() => new Animated.Value(1), []);
  const isDisabled = disabled || loading;

  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary },
    secondary: { bg: theme.colors.primarySoft, fg: theme.colors.onPrimarySoft },
    ghost: { bg: 'transparent', fg: theme.colors.text, border: theme.colors.border },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
  };
  const c = palette[variant];
  const height = size === 'lg' ? 54 : 46;
  const fontVariant = size === 'lg' ? 'heading' : 'label';

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity: isDisabled ? 0.55 : 1 },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => spring(0.96)}
        onPressOut={() => spring(1)}
        onPress={(e) => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
        style={[
          styles.base,
          {
            height,
            backgroundColor: c.bg,
            borderRadius: theme.radius.lg,
            borderWidth: c.border ? StyleSheet.hairlineWidth * 2 : 0,
            borderColor: c.border,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={c.fg} />
        ) : (
          <View style={styles.content}>
            {Icon ? <Icon size={size === 'lg' ? 20 : 18} color={c.fg} strokeWidth={2.4} /> : null}
            <Text variant={fontVariant} style={{ color: c.fg }}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
