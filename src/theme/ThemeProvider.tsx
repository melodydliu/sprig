import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  categoryColors,
  elevation,
  palettes,
  radius,
  spacing,
  swatchColors,
  typography,
  type ColorScheme,
  type Palette,
} from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  categoryColor: (category: string) => { color: string; soft: string };
  swatch: (name: string) => string;
  elevation: (level: 1 | 2 | 3) => ReturnType<typeof elevation>;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = system === 'dark' ? 'dark' : 'light';

  const theme = useMemo<Theme>(() => {
    return {
      scheme,
      colors: palettes[scheme],
      spacing,
      radius,
      typography,
      categoryColor: (category) => {
        const entry = categoryColors[category] ?? categoryColors.other;
        return {
          color: scheme === 'dark' ? entry.dark : entry.light,
          soft: scheme === 'dark' ? entry.softDark : entry.softLight,
        };
      },
      swatch: (name) => swatchColors[name] ?? swatchColors.other ?? '#999999',
      elevation: (level) => elevation(scheme, level),
    };
  }, [scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
