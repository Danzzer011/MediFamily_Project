import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useColorScheme } from 'react-native';

/** MediFamily light palette. */
const lightColors = {
  /** Page background (soft off-white). */
  background: '#F5FAF9',
  /** Cards and input backgrounds. */
  surface: '#FFFFFF',
  /** Main text (deep navy). */
  text: '#16324F',
  /** Secondary text, hints and captions. */
  textMuted: '#52625E',
  border: '#D3E2DF',
  /** Brand teal: primary buttons, links and focused inputs. */
  primary: '#0F766E',
  onPrimary: '#FFFFFF',
  danger: '#B42318',
  onDanger: '#FFFFFF',
  /** Tinted background behind error messages. */
  dangerSurface: '#FEF3F2',
  /** Quiet background for secondary notices such as the demo-data notice. */
  notice: '#EAF3F1',
  onNotice: '#52625E',
};

export type ThemeColors = typeof lightColors;

/** Dark counterparts that keep the same teal and navy character. */
const darkColors: ThemeColors = {
  background: '#0D1B21',
  surface: '#15272E',
  text: '#E3EEF1',
  textMuted: '#9FB5B0',
  border: '#2A434A',
  primary: '#2BB5A8',
  onPrimary: '#06201D',
  danger: '#F97066',
  onDanger: '#2A0A07',
  dangerSurface: '#3A1A17',
  notice: '#17302F',
  onNotice: '#9FB5B0',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

/** Readable width for forms and cards on tablets and in the browser. */
export const maxContentWidth = 440;

export const typography = {
  brand: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18 },
} as const;

/** Colours for the device's current light/dark setting. */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/** Navigation (header, screen background) theme matching the app colours. */
export function useNavigationTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  const base = dark ? DarkTheme : DefaultTheme;
  const colors = dark ? darkColors : lightColors;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
}
