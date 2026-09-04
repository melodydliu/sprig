/**
 * Sprig design tokens.
 *
 * Warm neutrals (off-white, soft sand) with a deep botanical green primary and a
 * terracotta accent. Marigold is reserved for the "favorite" state. Category
 * colors are distinguishable but earthy so the journal reads as one palette.
 */

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** App background. */
  background: string;
  /** Slightly raised background (grouped sections, inputs). */
  backgroundAlt: string;
  /** Card / sheet surface. */
  surface: string;
  /** Pressed / selected surface. */
  surfacePressed: string;
  /** Hairline borders and dividers. */
  border: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  /** Text/icon that sits on top of `primary`. */
  onPrimary: string;

  primary: string;
  primaryPressed: string;
  /** Tinted primary background for chips / soft buttons. */
  primarySoft: string;
  onPrimarySoft: string;

  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccentSoft: string;

  /** Favorite (marigold). */
  favorite: string;

  danger: string;
  dangerSoft: string;

  /** Map dot / generic success-ish green tint. */
  overlay: string;
  /** Shadow color for elevation. */
  shadow: string;
}

const light: Palette = {
  background: '#FAF6EE',
  backgroundAlt: '#F2EBDD',
  surface: '#FFFDF7',
  surfacePressed: '#F0E9DA',
  border: '#E6DCC9',

  text: '#2C2822',
  textSecondary: '#6B6357',
  textMuted: '#9A9081',
  onPrimary: '#F7FBF4',

  primary: '#356B4B',
  primaryPressed: '#2A5A3D',
  primarySoft: '#E1EDE2',
  onPrimarySoft: '#2A5A3D',

  accent: '#C56A45',
  accentPressed: '#AE5836',
  accentSoft: '#F4E1D5',
  onAccentSoft: '#8F4325',

  favorite: '#E0A63D',

  danger: '#B24A38',
  dangerSoft: '#F1DAD3',

  overlay: 'rgba(44, 40, 34, 0.45)',
  shadow: '#3A2E1C',
};

const dark: Palette = {
  background: '#181611',
  backgroundAlt: '#211E18',
  surface: '#262218',
  surfacePressed: '#322D22',
  border: '#3B352B',

  text: '#F2ECDF',
  textSecondary: '#B7AE9E',
  textMuted: '#877E6D',
  onPrimary: '#F7FBF4',

  primary: '#6FA97F',
  primaryPressed: '#5E9670',
  primarySoft: '#293A2E',
  onPrimarySoft: '#B5D6BC',

  accent: '#D98A66',
  accentPressed: '#C47854',
  accentSoft: '#3B2C22',
  onAccentSoft: '#E9B79E',

  favorite: '#E6B457',

  danger: '#D9705B',
  dangerSoft: '#3A241E',

  overlay: 'rgba(0, 0, 0, 0.55)',
  shadow: '#000000',
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

/** Per-category accent colors, keyed by each entry in `Entry.categories`. */
export const categoryColors: Record<
  string,
  { light: string; dark: string; softLight: string; softDark: string }
> = {
  flower: { light: '#C86B8A', dark: '#DD8AA5', softLight: '#F5E0E7', softDark: '#3A2A31' },
  foliage: { light: '#4F7A4C', dark: '#77A874', softLight: '#E1EBDD', softDark: '#28331F' },
  fruit_vegetable: { light: '#B5532E', dark: '#D57C58', softLight: '#F3DED3', softDark: '#38261E' },
  branch_stem: { light: '#8A6A4A', dark: '#B08F6B', softLight: '#ECE2D3', softDark: '#332A20' },
  seed_pod_dried: { light: '#B0893E', dark: '#CFA860', softLight: '#F0E6CF', softDark: '#352C1B' },
  other: { light: '#6E7B8B', dark: '#94A1B1', softLight: '#E4E7EC', softDark: '#262B31' },
};

/** Swatch colors for the fixed `colors` palette on an entry. */
export const swatchColors: Record<string, string> = {
  white: '#F4F1E8',
  cream: '#EFE2C4',
  yellow: '#E7C24C',
  orange: '#DC8B3E',
  red: '#B23B2E',
  pink: '#D580A2',
  purple: '#8A6BB0',
  blue: '#5A80A9',
  green: '#5C8C4D',
  brown: '#8A6A4A',
  black: '#2E2A24',
  multi: 'multi',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const fontFamily = {
  /** UI: friendly rounded sans. */
  sans: 'Nunito_400Regular',
  sansMedium: 'Nunito_600SemiBold',
  sansBold: 'Nunito_700Bold',
  sansHeavy: 'Nunito_800ExtraBold',
  /** Journal-like serif, used for entry names and big headings. */
  serif: 'Fraunces_500Medium',
  serifBold: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_400Regular_Italic',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.serifBold, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fontFamily.serifBold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fontFamily.sansHeavy, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.sans, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.sansMedium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fontFamily.sansBold, fontSize: 13, lineHeight: 16 },
  caption: { fontFamily: fontFamily.sansMedium, fontSize: 12, lineHeight: 16 },
  serifItalic: { fontFamily: fontFamily.serifItalic, fontSize: 15, lineHeight: 22 },
} as const;

export type TypographyVariant = keyof typeof typography;

export function elevation(scheme: ColorScheme, level: 1 | 2 | 3) {
  const opacity = scheme === 'dark' ? [0.4, 0.5, 0.6] : [0.08, 0.12, 0.16];
  const config = {
    1: { height: 1, radius: 3, elev: 1 },
    2: { height: 4, radius: 12, elev: 4 },
    3: { height: 10, radius: 24, elev: 10 },
  }[level];
  return {
    shadowColor: palettes[scheme].shadow,
    shadowOffset: { width: 0, height: config.height },
    shadowOpacity: opacity[level - 1],
    shadowRadius: config.radius,
    elevation: config.elev,
  };
}
