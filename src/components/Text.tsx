import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { Palette, TypographyVariant } from '@/theme/tokens';

type ColorProp = keyof Palette | (string & {});

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorProp;
  center?: boolean;
}

export function Text({
  variant = 'body',
  color = 'text',
  center,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const resolved =
    color in theme.colors ? theme.colors[color as keyof Palette] : (color as string);
  return (
    <RNText
      {...rest}
      style={[
        theme.typography[variant],
        { color: resolved },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
